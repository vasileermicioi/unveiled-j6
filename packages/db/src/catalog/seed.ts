import { eq, sql } from "drizzle-orm";

import type { Db } from "../index";
import { bookings } from "../schema/bookings";
import { events } from "../schema/events";
import { partners } from "../schema/partners";
import { waitlistEntries } from "../schema/waitlist-entries";
import { DEMO_DISCOVERY_TITLES } from "./demo-discovery-titles";
import { countEvents, createEvent, listEvents } from "./events";
import { addFeaturedEvent } from "./featured-events";
import { deleteImageRecord } from "./images";
import { countPartners, createPartner, listPartners } from "./partners";
import { getDemoCatalog } from "./seed-data";

/** Upcoming demo titles featured on Discover after seed (leave others non-featured for e2e contrast). */
const DEMO_FEATURED_TITLES: readonly string[] = [
  DEMO_DISCOVERY_TITLES.tonight,
  DEMO_DISCOVERY_TITLES.theaterFuture,
  DEMO_DISCOVERY_TITLES.ausstellung,
];

export type DemoSeedResult = "seeded" | "skipped";

export async function shouldRunDemoSeed(db: Db): Promise<boolean> {
  const [partnerCount, eventCount] = await Promise.all([countPartners(db), countEvents(db)]);
  return partnerCount === 0 && eventCount === 0;
}

/**
 * Wipe catalog seed data. Clears RESTRICT dependents first, then events/partners,
 * then images (events may share image ids from e2e fixtures, so images go last).
 * `saved_events` cascade when events are deleted.
 */
export async function resetCatalogData(
  db: Db,
  options: { skipBucket?: boolean } = {},
): Promise<{ partnersDeleted: number; eventsDeleted: number }> {
  // Neon HTTP driver rejects DELETE without WHERE — use a tautology.
  await db.delete(bookings).where(sql`true`);
  await db.delete(waitlistEntries).where(sql`true`);

  const eventsList = await listEvents(db, { limit: 10_000 });
  const partnersList = await listPartners(db, { limit: 10_000 });

  const imageIds = new Set<string>();
  for (const event of eventsList) {
    imageIds.add(event.imageId);
  }
  for (const partner of partnersList) {
    if (partner.logoImageId) {
      imageIds.add(partner.logoImageId);
    }
  }

  // Delete rows without per-row image cleanup (shared images would fail mid-loop).
  for (const event of eventsList) {
    await db.delete(events).where(eq(events.id, event.id));
  }
  for (const partner of partnersList) {
    await db.delete(partners).where(eq(partners.id, partner.id));
  }

  for (const imageId of imageIds) {
    try {
      await deleteImageRecord(db, imageId, { skipBucket: options.skipBucket });
    } catch {
      // Image may already be gone or still referenced by non-catalog rows — ignore.
    }
  }

  return { partnersDeleted: partnersList.length, eventsDeleted: eventsList.length };
}

const SEED_IMAGE_PAUSE_MS = 750;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runDemoSeed(
  db: Db,
  options: { force?: boolean; skipBucket?: boolean } = {},
): Promise<DemoSeedResult> {
  if (options.force) {
    await resetCatalogData(db, { skipBucket: options.skipBucket });
  } else if (!(await shouldRunDemoSeed(db))) {
    return "skipped";
  }

  const pauseMs = SEED_IMAGE_PAUSE_MS;

  const createdByTitle = new Map<string, string>();

  for (const entry of getDemoCatalog()) {
    const partner = await createPartner(db, entry.partner);
    await sleep(pauseMs);

    for (const eventInput of entry.events) {
      const created = await createEvent(db, { ...eventInput, partnerId: partner.id });
      createdByTitle.set(created.title, created.id);
      // DEMO_SOLD_OUT_WAITLIST: force zero remaining for Phase 7 waitlist demos
      if (created.title === DEMO_DISCOVERY_TITLES.soldOutWaitlist) {
        await db.update(events).set({ remainingCapacity: 0 }).where(eq(events.id, created.id));
      }
      await sleep(pauseMs);
    }
  }

  for (const title of DEMO_FEATURED_TITLES) {
    const eventId = createdByTitle.get(title);
    if (eventId) {
      await addFeaturedEvent(db, eventId);
    }
  }

  return "seeded";
}
