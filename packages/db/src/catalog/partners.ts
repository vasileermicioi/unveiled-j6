import { count, eq, ilike, or } from "drizzle-orm";

import type { Db } from "../index";
import { events } from "../schema/events";
import { type Partner, partners } from "../schema/partners";
import { CatalogValidationError } from "./errors";
import { deleteImageRecord, persistImageFromSource, replacePartnerLogo } from "./images";
import { requireNonEmpty, validateEmail, validateImageSourceExclusive } from "./validation";

export type ListPartnersOptions = {
  limit?: number;
  offset?: number;
  q?: string;
};

export type CreatePartnerInput = {
  name: string;
  address: string;
  contactEmail: string;
  venueCheckInToken?: string | null;
  logoUpload?: Buffer | null;
  logoUrl?: string | null;
  uploadedBy?: string | null;
  skipUpload?: boolean;
};

export type UpdatePartnerInput = {
  name?: string;
  address?: string;
  contactEmail?: string;
  logoUpload?: Buffer | null;
  logoUrl?: string | null;
  uploadedBy?: string | null;
  skipUpload?: boolean;
};

function generateVenueCheckInToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export async function getPartnerById(db: Db, partnerId: string): Promise<Partner | null> {
  return (
    (await db.query.partners.findFirst({
      where: eq(partners.id, partnerId),
    })) ?? null
  );
}

function partnerSearchCondition(q?: string) {
  const search = q?.trim();
  if (!search) {
    return undefined;
  }

  const pattern = `%${search}%`;
  return or(ilike(partners.name, pattern), ilike(partners.contactEmail, pattern));
}

export async function listPartners(db: Db, options: ListPartnersOptions = {}): Promise<Partner[]> {
  const limit = options.limit ?? 25;
  const offset = options.offset ?? 0;
  const searchCondition = partnerSearchCondition(options.q);

  if (searchCondition) {
    return db.select().from(partners).where(searchCondition).limit(limit).offset(offset);
  }

  return db.select().from(partners).limit(limit).offset(offset);
}

export async function createPartner(db: Db, input: CreatePartnerInput): Promise<Partner> {
  const name = requireNonEmpty(input.name, "name");
  const address = requireNonEmpty(input.address, "address");
  const contactEmail = validateEmail(input.contactEmail);
  validateImageSourceExclusive(input.logoUpload, input.logoUrl);

  let logoImageId: string | null = null;
  const logoSource = validateImageSourceExclusive(input.logoUpload, input.logoUrl);
  if (logoSource) {
    logoImageId = await persistImageFromSource(db, logoSource, {
      uploadedBy: input.uploadedBy,
      skipUpload: input.skipUpload,
    });
  }

  const venueCheckInToken = input.venueCheckInToken?.trim() || generateVenueCheckInToken();

  const inserted = await db
    .insert(partners)
    .values({
      name,
      address,
      contactEmail,
      logoImageId,
      venueCheckInToken,
    })
    .returning();

  const partner = inserted[0];
  if (!partner) {
    throw new Error("Failed to create partner");
  }

  return partner;
}

export async function renamePartnerSyncEvents(
  db: Db,
  partnerId: string,
  newName: string,
): Promise<void> {
  await db
    .update(events)
    .set({
      partnerName: newName,
      updatedAt: new Date(),
    })
    .where(eq(events.partnerId, partnerId));
}

export async function updatePartner(
  db: Db,
  partnerId: string,
  input: UpdatePartnerInput,
): Promise<Partner> {
  const existing = await getPartnerById(db, partnerId);
  if (!existing) {
    throw new CatalogValidationError("PARTNER_NOT_FOUND", `Partner ${partnerId} not found`);
  }

  validateImageSourceExclusive(input.logoUpload, input.logoUrl);

  const nextName = input.name !== undefined ? requireNonEmpty(input.name, "name") : existing.name;
  const nextAddress =
    input.address !== undefined ? requireNonEmpty(input.address, "address") : existing.address;
  const nextEmail =
    input.contactEmail !== undefined ? validateEmail(input.contactEmail) : existing.contactEmail;

  const logoImageId = await replacePartnerLogo(
    db,
    partnerId,
    existing.logoImageId,
    input.logoUpload,
    input.logoUrl,
    {
      uploadedBy: input.uploadedBy,
      skipUpload: input.skipUpload,
    },
  );

  const previousLogoImageId = existing.logoImageId;

  const updated = await db
    .update(partners)
    .set({
      name: nextName,
      address: nextAddress,
      contactEmail: nextEmail,
      logoImageId: logoImageId ?? existing.logoImageId,
      updatedAt: new Date(),
    })
    .where(eq(partners.id, partnerId))
    .returning();

  const partner = updated[0];
  if (!partner) {
    throw new Error(`Failed to update partner ${partnerId}`);
  }

  if (nextName !== existing.name) {
    await renamePartnerSyncEvents(db, partnerId, nextName);
  }

  const nextLogoImageId = logoImageId ?? existing.logoImageId;
  if (previousLogoImageId && nextLogoImageId && previousLogoImageId !== nextLogoImageId) {
    await deleteImageRecord(db, previousLogoImageId, { skipBucket: input.skipUpload });
  }

  return partner;
}

export async function regenerateVenueCheckInToken(db: Db, partnerId: string): Promise<Partner> {
  const existing = await getPartnerById(db, partnerId);
  if (!existing) {
    throw new CatalogValidationError("PARTNER_NOT_FOUND", `Partner ${partnerId} not found`);
  }

  const updated = await db
    .update(partners)
    .set({
      venueCheckInToken: generateVenueCheckInToken(),
      updatedAt: new Date(),
    })
    .where(eq(partners.id, partnerId))
    .returning();

  const partner = updated[0];
  if (!partner) {
    throw new Error(`Failed to regenerate venue check-in token for partner ${partnerId}`);
  }

  return partner;
}

export async function deletePartner(
  db: Db,
  partnerId: string,
  options?: { skipBucket?: boolean },
): Promise<void> {
  const existing = await getPartnerById(db, partnerId);
  if (!existing) {
    throw new CatalogValidationError("PARTNER_NOT_FOUND", `Partner ${partnerId} not found`);
  }

  const [eventCount] = await db
    .select({ count: count() })
    .from(events)
    .where(eq(events.partnerId, partnerId));
  if ((eventCount?.count ?? 0) > 0) {
    throw new CatalogValidationError(
      "PARTNER_HAS_EVENTS",
      "Cannot delete a partner that still has events",
    );
  }

  const logoImageId = existing.logoImageId;

  await db.delete(partners).where(eq(partners.id, partnerId));

  if (logoImageId) {
    await deleteImageRecord(db, logoImageId, { skipBucket: options?.skipBucket });
  }
}

export type CountPartnersOptions = {
  q?: string;
};

export async function countPartners(db: Db, options: CountPartnersOptions = {}): Promise<number> {
  const searchCondition = partnerSearchCondition(options.q);

  if (searchCondition) {
    const [result] = await db.select({ count: count() }).from(partners).where(searchCondition);
    return result?.count ?? 0;
  }

  const [result] = await db.select({ count: count() }).from(partners);
  return result?.count ?? 0;
}
