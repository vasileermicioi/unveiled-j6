import { eq, sql } from "drizzle-orm";

import type { Db } from "../index";
import { bookings } from "../schema/bookings";
import { eventGalleryImages } from "../schema/event-gallery-images";
import { events } from "../schema/events";
import { partners } from "../schema/partners";
import { waitlistEntries } from "../schema/waitlist-entries";
import { DEMO_DISCOVERY_TITLES } from "./demo-discovery-titles";
import { addEventGalleryImages } from "./event-gallery-images";
import { countEvents, createEvent, listEvents } from "./events";
import { addFeaturedEvent } from "./featured-events";
import { addFeaturedPartner } from "./featured-partners";
import { deleteImageRecord, persistPrebuiltImage } from "./images";
import { countPartners, createPartner, listPartners } from "./partners";
import { getDemoCatalog, readDemoSeedPrebuilt } from "./seed-data";

/** Upcoming demo titles featured on Discover after seed (leave others non-featured for e2e contrast). */
const DEMO_FEATURED_TITLES: readonly string[] = [
  DEMO_DISCOVERY_TITLES.tonight,
  DEMO_DISCOVERY_TITLES.theaterFuture,
  DEMO_DISCOVERY_TITLES.ausstellung,
];

/** How many seeded partners to feature on Discover (leave others non-featured for contrast). */
const DEMO_FEATURED_PARTNER_LIMIT = 4;

/**
 * Featured upcoming host for demo gallery (≥2 images). Prefer theaterFuture —
 * tonight (daysFromToday: 0) may already be past in Europe/Berlin evening runs.
 */
const DEMO_GALLERY_HOST_TITLE = DEMO_DISCOVERY_TITLES.theaterFuture;

/** Distinct seed fixture paths (not the host event hero) for gallery demos. */
const DEMO_GALLERY_IMAGE_PATHS: readonly string[] = ["events/yami-safdie.jpg", "events/ende.jpg"];

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
  const galleryRows = await db
    .select({ imageId: eventGalleryImages.imageId })
    .from(eventGalleryImages);

  const imageIds = new Set<string>();
  for (const event of eventsList) {
    imageIds.add(event.imageId);
  }
  for (const partner of partnersList) {
    if (partner.logoImageId) {
      imageIds.add(partner.logoImageId);
    }
  }
  for (const row of galleryRows) {
    imageIds.add(row.imageId);
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

async function seedDemoEventGallery(
  db: Db,
  eventId: string,
  options: { skipBucket?: boolean } = {},
): Promise<void> {
  const imageIds: string[] = [];
  for (const relativePath of DEMO_GALLERY_IMAGE_PATHS) {
    const prebuilt = readDemoSeedPrebuilt(relativePath, `gallery ${relativePath}`);
    const imageId = await persistPrebuiltImage(db, prebuilt, {
      skipUpload: options.skipBucket,
    });
    imageIds.push(imageId);
    await sleep(SEED_IMAGE_PAUSE_MS);
  }
  await addEventGalleryImages(db, eventId, imageIds);
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
  const createdPartners: { id: string; hasLogo: boolean }[] = [];

  for (const entry of getDemoCatalog()) {
    const partner = await createPartner(db, entry.partner);
    createdPartners.push({ id: partner.id, hasLogo: Boolean(partner.logoImageId) });
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

  // Prefer partners with logos; leave ≥1 non-featured when the catalog has 2+.
  const featuredPartnerCandidates = [
    ...createdPartners.filter((p) => p.hasLogo),
    ...createdPartners.filter((p) => !p.hasLogo),
  ];
  const maxFeaturedPartners =
    createdPartners.length <= 1
      ? createdPartners.length
      : Math.min(DEMO_FEATURED_PARTNER_LIMIT, createdPartners.length - 1);
  for (const partner of featuredPartnerCandidates.slice(0, maxFeaturedPartners)) {
    await addFeaturedPartner(db, partner.id);
  }

  const galleryHostId = createdByTitle.get(DEMO_GALLERY_HOST_TITLE);
  if (galleryHostId) {
    await seedDemoEventGallery(db, galleryHostId, { skipBucket: options.skipBucket });
  }

  return "seeded";
}
