import {
  addFeaturedEvent,
  addFeaturedPartner,
  CatalogValidationError,
  createDb,
  eq,
  events,
  listEventGalleryImages,
  listEvents,
  listFeaturedPartners,
  listPartners,
  removeFeaturedEvent,
  removeFeaturedPartner,
} from "@unveiled/db";
import { DEMO_DISCOVERY_TITLES } from "@unveiled/db/seed-titles";

/**
 * Resolve a demo partner id for GET `partnerId=` filters.
 * Prefer this over scraping option lists from the rendered admin UI.
 */
export async function getPartnerIdByName(name: string): Promise<string> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required to resolve partner ids for discovery E2E");
  }

  const db = createDb(url);
  const rows = await listPartners(db, { q: name, limit: 25 });
  const hit = rows.find((partner) => partner.name === name);
  if (!hit) {
    throw new Error(`Partner not found in catalog: ${name}`);
  }
  return hit.id;
}

/** Resolve a seeded event id by exact title (for public detail / map consent E2E). */
export async function getEventIdByTitle(title: string): Promise<string> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required to resolve event ids for E2E");
  }

  const db = createDb(url);
  const rows = await listEvents(db, { q: title, limit: 25 });
  const hit = rows.find((event) => event.title === title);
  if (!hit) {
    throw new Error(`Event not found in catalog: ${title}`);
  }
  return hit.id;
}

function isAlreadyFeaturedError(error: unknown): boolean {
  if (error instanceof CatalogValidationError && error.code === "ALREADY_FEATURED") {
    return true;
  }
  const message = error instanceof Error ? error.message : String(error);
  return /featured_events_pkey|featured_partners_pkey|duplicate key|already featured/i.test(
    message,
  );
}

/**
 * Align demo featured rows with seed contract for Discover e2e:
 * theaterFuture / ausstellung featured (reliably upcoming); konzert left non-featured.
 * Prefer theaterFuture over tonight — tonight (daysFromToday: 0) may already be past.
 */
export async function ensureDemoFeaturedSplit(): Promise<void> {
  const db = createDb(requireDatabaseUrl());
  const featured = [DEMO_DISCOVERY_TITLES.theaterFuture, DEMO_DISCOVERY_TITLES.ausstellung];
  for (const title of featured) {
    const eventId = await getEventIdByTitle(title);
    try {
      await addFeaturedEvent(db, eventId);
    } catch (error) {
      if (!isAlreadyFeaturedError(error)) {
        throw error;
      }
    }
  }
  try {
    const konzertId = await getEventIdByTitle(DEMO_DISCOVERY_TITLES.konzert);
    await removeFeaturedEvent(db, konzertId);
  } catch {
    // konzert missing or not featured — fine
  }
}

function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error("DATABASE_URL is required for featured catalog E2E fixtures");
  }
  return url;
}

/**
 * Align demo featured partners for Discover e2e: at least one featured and one
 * non-featured partner (by name) for curated Partner venues contrast.
 */
export async function ensureDemoFeaturedPartnersSplit(): Promise<{
  featuredName: string;
  nonFeaturedName: string;
}> {
  const db = createDb(requireDatabaseUrl());
  const all = await listPartners(db, { limit: 100 });
  if (all.length < 2) {
    throw new Error(
      `Need ≥2 catalog partners for featured-partners Discover contrast (found ${all.length}). Run: bun run seed:demo`,
    );
  }

  const firstPartner = all[0];
  if (!firstPartner) {
    throw new Error("Need ≥2 catalog partners for featured-partners Discover contrast");
  }

  let featured = await listFeaturedPartners(db);
  if (featured.length === 0) {
    try {
      await addFeaturedPartner(db, firstPartner.id);
    } catch (error) {
      if (!isAlreadyFeaturedError(error)) {
        throw error;
      }
    }
    featured = await listFeaturedPartners(db);
  }

  const featuredIds = new Set(featured.map((partner) => partner.id));
  let nonFeatured = all.find((partner) => !featuredIds.has(partner.id));
  if (!nonFeatured) {
    // All partners featured — free the last one for contrast.
    const last = all[all.length - 1];
    if (!last) {
      throw new Error("Need ≥2 catalog partners for featured-partners Discover contrast");
    }
    await removeFeaturedPartner(db, last.id);
    nonFeatured = last;
    featured = await listFeaturedPartners(db);
  }

  const featuredRow = featured[0];
  if (!featuredRow) {
    throw new Error("Failed to ensure at least one featured partner for Discover e2e");
  }

  return { featuredName: featuredRow.name, nonFeaturedName: nonFeatured.name };
}

/**
 * Resolve a demo event that already has ≥2 gallery images (from `bun run seed:demo`).
 * Prefer theaterFuture — featured + reliably upcoming. Does not attach images here
 * (Playwright cannot load `@unveiled/db/seed` / `@unveiled/images` prebuilt helpers).
 */
export async function ensureDemoEventGallery(
  title: string = DEMO_DISCOVERY_TITLES.theaterFuture,
): Promise<string> {
  const db = createDb(requireDatabaseUrl());
  const eventId = await getEventIdByTitle(title);
  const existing = await listEventGalleryImages(db, eventId);
  if (existing.length < 2) {
    throw new Error(
      `Demo event "${title}" needs ≥2 gallery images (found ${existing.length}). Run: bun run seed:demo -- --reset`,
    );
  }
  return eventId;
}

/** Restore bookable capacity when prior e2e runs depleted a seed event. */
export async function ensureEventHasCapacity(title: string, minRemaining = 5): Promise<string> {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is required to restore event capacity for E2E");
  }
  const db = createDb(url);
  const row = await db.query.events.findFirst({
    where: eq(events.title, title),
  });
  if (!row) {
    throw new Error(`Event not found in catalog: ${title}`);
  }
  if (row.remainingCapacity < minRemaining) {
    const nextTotal = Math.max(row.totalCapacity, minRemaining);
    await db
      .update(events)
      .set({
        totalCapacity: nextTotal,
        remainingCapacity: minRemaining,
        updatedAt: new Date(),
      })
      .where(eq(events.id, row.id));
  }
  return row.id;
}
