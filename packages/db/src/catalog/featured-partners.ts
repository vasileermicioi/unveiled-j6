import { and, asc, desc, eq, ilike, inArray, max, notExists, type SQL } from "drizzle-orm";

import type { Db } from "../index";
import { featuredPartners } from "../schema/featured-partners";
import { type Partner, partners } from "../schema/partners";
import { CatalogValidationError } from "./errors";
import { getPartnerById } from "./partners";

export type FeaturedPartnerRow = Partner & { sortOrder: number };

/** Temp offset for reorder writes (admin curated lists stay small). */
const FEATURED_PARTNERS_REORDER_TEMP_BASE = 10_000;

export type ListFeaturedPartnersOptions = {
  limit?: number;
};

export type SearchPartnersNotFeaturedOptions = {
  q?: string;
  limit?: number;
  offset?: number;
};

function partnerSearchCondition(q?: string): SQL | undefined {
  const search = q?.trim();
  if (!search) {
    return undefined;
  }

  const pattern = `%${search}%`;
  return ilike(partners.name, pattern);
}

export async function listFeaturedPartners(
  db: Db,
  options: ListFeaturedPartnersOptions = {},
): Promise<FeaturedPartnerRow[]> {
  let query = db
    .select({
      partner: partners,
      sortOrder: featuredPartners.sortOrder,
    })
    .from(featuredPartners)
    .innerJoin(partners, eq(featuredPartners.partnerId, partners.id))
    .$dynamic();

  query = query.orderBy(asc(featuredPartners.sortOrder), asc(partners.name));
  if (options.limit != null) {
    query = query.limit(options.limit);
  }

  const rows = await query;
  return rows.map((row) => ({ ...row.partner, sortOrder: row.sortOrder }));
}

export async function searchPartnersNotFeatured(
  db: Db,
  options: SearchPartnersNotFeaturedOptions = {},
): Promise<Partner[]> {
  const limit = options.limit ?? 25;
  const offset = options.offset ?? 0;
  const conditions: SQL[] = [
    notExists(
      db
        .select({ one: featuredPartners.partnerId })
        .from(featuredPartners)
        .where(eq(featuredPartners.partnerId, partners.id)),
    ),
  ];

  const searchCondition = partnerSearchCondition(options.q);
  if (searchCondition) {
    conditions.push(searchCondition);
  }

  return db
    .select()
    .from(partners)
    .where(and(...conditions))
    .orderBy(desc(partners.createdAt), desc(partners.id))
    .limit(limit)
    .offset(offset);
}

export async function addFeaturedPartner(db: Db, partnerId: string): Promise<FeaturedPartnerRow> {
  const partner = await getPartnerById(db, partnerId);
  if (!partner) {
    throw new CatalogValidationError("PARTNER_NOT_FOUND", `Partner ${partnerId} not found`);
  }

  const [existing] = await db
    .select({ partnerId: featuredPartners.partnerId })
    .from(featuredPartners)
    .where(eq(featuredPartners.partnerId, partnerId))
    .limit(1);
  if (existing) {
    throw new CatalogValidationError(
      "ALREADY_FEATURED",
      `Partner ${partnerId} is already featured`,
    );
  }

  const [maxRow] = await db
    .select({ maxSort: max(featuredPartners.sortOrder) })
    .from(featuredPartners);
  const sortOrder = (maxRow?.maxSort ?? -1) + 1;

  await db.insert(featuredPartners).values({ partnerId, sortOrder });

  return { ...partner, sortOrder };
}

export async function removeFeaturedPartner(db: Db, partnerId: string): Promise<void> {
  await removeFeaturedPartners(db, [partnerId]);
}

/**
 * Remove featured membership for the given partners. Underlying `partners` rows are kept.
 */
export async function removeFeaturedPartners(db: Db, partnerIds: string[]): Promise<void> {
  if (partnerIds.length === 0) {
    return;
  }
  const uniqueIds = [...new Set(partnerIds)];
  await db.delete(featuredPartners).where(inArray(featuredPartners.partnerId, uniqueIds));
}

/**
 * Persist a new featured-partners order. `orderedPartnerIds` must be a permutation of
 * the current featured set (same ids, same length). Writes `sort_order` as 0..n-1.
 */
export async function reorderFeaturedPartners(
  db: Db,
  orderedPartnerIds: string[],
): Promise<FeaturedPartnerRow[]> {
  const existing = await listFeaturedPartners(db);
  const existingIds = existing.map((row) => row.id);

  if (orderedPartnerIds.length === 0 && existingIds.length === 0) {
    return [];
  }

  const uniqueOrdered = [...new Set(orderedPartnerIds)];
  if (
    uniqueOrdered.length !== orderedPartnerIds.length ||
    uniqueOrdered.length !== existingIds.length
  ) {
    throw new CatalogValidationError(
      "FEATURED_PARTNERS_REORDER_INVALID",
      "Featured partners reorder must include each current partner id exactly once",
    );
  }

  const existingSet = new Set(existingIds);
  for (const partnerId of uniqueOrdered) {
    if (!existingSet.has(partnerId)) {
      throw new CatalogValidationError(
        "FEATURED_PARTNERS_REORDER_INVALID",
        `Partner ${partnerId} is not on the featured partners list`,
      );
    }
  }

  for (let i = 0; i < uniqueOrdered.length; i += 1) {
    const partnerId = uniqueOrdered[i];
    if (!partnerId) {
      continue;
    }
    await db
      .update(featuredPartners)
      .set({ sortOrder: FEATURED_PARTNERS_REORDER_TEMP_BASE + i })
      .where(eq(featuredPartners.partnerId, partnerId));
  }

  for (let i = 0; i < uniqueOrdered.length; i += 1) {
    const partnerId = uniqueOrdered[i];
    if (!partnerId) {
      continue;
    }
    await db
      .update(featuredPartners)
      .set({ sortOrder: i })
      .where(eq(featuredPartners.partnerId, partnerId));
  }

  return listFeaturedPartners(db);
}
