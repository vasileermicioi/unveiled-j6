import { randomUUID } from "node:crypto";
import { uploadPrivateObject } from "@unveiled/images";
import { eq, sql } from "drizzle-orm";

import { purgeAllBookingTicketGraph } from "../booking/purge-booking-tickets";
import type { Db } from "../index";
import { bookings } from "../schema/bookings";
import { eventGalleryImages } from "../schema/event-gallery-images";
import { events } from "../schema/events";
import { partners } from "../schema/partners";
import { waitlistEntries } from "../schema/waitlist-entries";
import { DEMO_DISCOVERY_TITLES, DEMO_PROMO_CODES } from "./demo-discovery-titles";
import { addEventGalleryImages } from "./event-gallery-images";
import { countEvents, createEvent, listEvents } from "./events";
import { addFeaturedEvent } from "./featured-events";
import { addFeaturedPartner } from "./featured-partners";
import { deleteImageRecord, persistPrebuiltImage } from "./images";
import { countPartners, createPartner, listPartners } from "./partners";
import { getDemoCatalog, readDemoSeedPrebuilt } from "./seed-data";
import { appendPromoCodes, appendVoucherPdfs } from "./voucher-inventory";

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

/** Shared hero for additive voucher demo events (reuses an existing fixture pack). */
const DEMO_VOUCHER_EVENT_IMAGE_PATH = "events/ende.jpg";

/** Minimal valid PDF bytes for demo VOUCHER_PDF inventory (one page). */
const MINIMAL_PDF_BYTES = Buffer.from(
  `%PDF-1.1
1 0 obj<< /Type /Catalog /Pages 2 0 R >>endobj
2 0 obj<< /Type /Pages /Kids [3 0 R] /Count 1 >>endobj
3 0 obj<< /Type /Page /Parent 2 0 R /MediaBox [0 0 200 200] >>endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000068 00000 n 
0000000125 00000 n 
trailer<< /Size 4 /Root 1 0 R >>
startxref
203
%%EOF
`,
  "utf8",
);

const DEMO_VOUCHER_PDF_COUNT = 6;

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
  await purgeAllBookingTicketGraph(db);
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
    imageIds.add(partner.logoImageId);
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

/**
 * Additive SECRET/PROMO/PDF coverage: Abundo catalog remains SECRET_CODE;
 * stock one upcoming VOUCHER_PROMO and one VOUCHER_PDF with ≥4 inventory rows.
 */
async function seedDemoVoucherRedemptionEvents(
  db: Db,
  partnerId: string,
  options: { skipBucket?: boolean } = {},
): Promise<void> {
  const imagePrebuilt = readDemoSeedPrebuilt(
    DEMO_VOUCHER_EVENT_IMAGE_PATH,
    "voucher redemption demos",
  );
  // Persist once — reusing the same prebuilt imageId twice would violate images_pkey.
  const sharedImageId = await persistPrebuiltImage(db, imagePrebuilt, {
    skipUpload: options.skipBucket,
  });
  await sleep(SEED_IMAGE_PAUSE_MS);
  const dateTime = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);

  const promoEvent = await createEvent(db, {
    partnerId,
    title: DEMO_DISCOVERY_TITLES.voucherPromo,
    description: "Demo event with unique promo-code inventory for ticket-redemption walkthroughs.",
    street: "Demo Straße",
    houseNumber: "1",
    country: "DE",
    city: "berlin",
    zipCode: "10115",
    category: "Theater",
    eventType: "Performance",
    tags: ["demo", "voucher-promo"],
    dateTimes: [dateTime],
    creditPrice: 2,
    totalCapacity: DEMO_PROMO_CODES.length,
    ticketType: "VOUCHER_PROMO",
    eventWebsiteUrl: "https://example.com/demo-promo",
    stagedImageId: sharedImageId,
    languages: ["de", "en"],
    barrierFree: false,
    hasSubtitles: true,
    subtitleLanguage: "EN",
    skipUpload: options.skipBucket,
  });
  await appendPromoCodes(db, promoEvent.id, [...DEMO_PROMO_CODES]);
  await sleep(SEED_IMAGE_PAUSE_MS);

  const pdfEvent = await createEvent(db, {
    partnerId,
    title: DEMO_DISCOVERY_TITLES.voucherPdf,
    description: "Demo event with per-ticket PDF voucher inventory for download demos.",
    street: "Demo Straße",
    houseNumber: "2",
    country: "DE",
    city: "berlin",
    zipCode: "10115",
    category: "Konzert",
    eventType: "Concert",
    tags: ["demo", "voucher-pdf"],
    dateTimes: [new Date(dateTime.getTime() + 24 * 60 * 60 * 1000)],
    creditPrice: 2,
    totalCapacity: DEMO_VOUCHER_PDF_COUNT,
    ticketType: "VOUCHER_PDF",
    stagedImageId: sharedImageId,
    languages: ["de", "en"],
    barrierFree: false,
    skipUpload: options.skipBucket,
  });

  const pdfItems: { objectKey: string; originalFilename: string; pageLabel: string }[] = [];
  for (let i = 1; i <= DEMO_VOUCHER_PDF_COUNT; i++) {
    const objectKey = `vouchers/seed/${pdfEvent.id}/ticket-${i}-${randomUUID()}.pdf`;
    if (!options.skipBucket) {
      await uploadPrivateObject({
        objectKey,
        body: MINIMAL_PDF_BYTES,
        contentType: "application/pdf",
      });
    }
    pdfItems.push({
      objectKey,
      originalFilename: `demo-ticket-${i}.pdf`,
      pageLabel: String(i),
    });
  }
  await appendVoucherPdfs(db, pdfEvent.id, pdfItems);
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
    createdPartners.push({ id: partner.id, hasLogo: true });
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

  const voucherPartnerId = createdPartners[0]?.id;
  if (voucherPartnerId) {
    await seedDemoVoucherRedemptionEvents(db, voucherPartnerId, {
      skipBucket: options.skipBucket,
    });
  }

  return "seeded";
}
