import {
  addFeaturedEvent,
  addFeaturedPartner,
  berlinInclusiveDateRange,
  bookings,
  bookingTickets,
  CatalogValidationError,
  createDb,
  ensureVoucherInventoryAvailable,
  eq,
  events,
  getBerlinCalendarDate,
  getEventById,
  getPartnerById,
  images,
  listEventGalleryImages,
  listEvents,
  listFeaturedPartners,
  listPartners,
  type OpeningHoursWeek,
  partners,
  removeFeaturedEvent,
  removeFeaturedPartner,
  setEventPublished,
  setFeaturedEventPublished,
  setFeaturedPartnerPublished,
} from "@unveiled/db";
import { DEMO_DISCOVERY_TITLES } from "@unveiled/db/seed-titles";

import { getUserIdByEmail } from "./billing";

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
    await setEventPublished(db, eventId, true);
    await setFeaturedEventPublished(db, eventId, true);
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
  for (const row of featured) {
    await setFeaturedPartnerPublished(db, row.id, true);
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

/** Weekdays + Saturday 10:00–18:00, Sunday closed — one distinct open time for builder defaults. */
export const E2E_WEEKDAY_10_HOURS: OpeningHoursWeek = {
  mon: { open: "10:00", close: "18:00" },
  tue: { open: "10:00", close: "18:00" },
  wed: { open: "10:00", close: "18:00" },
  thu: { open: "10:00", close: "18:00" },
  fri: { open: "10:00", close: "18:00" },
  sat: { open: "10:00", close: "18:00" },
  sun: { closed: true },
};

function addCalendarDaysYmd(ymd: string, days: number): string {
  const [year, month, day] = ymd.split("-").map(Number);
  const utc = new Date(Date.UTC(year, (month ?? 1) - 1, (day ?? 1) + days));
  return `${utc.getUTCFullYear()}-${String(utc.getUTCMonth() + 1).padStart(2, "0")}-${String(utc.getUTCDate()).padStart(2, "0")}`;
}

function berlinWallClock(daysAhead: number, hour: number): Date {
  const ymd = addCalendarDaysYmd(getBerlinCalendarDate(new Date()), daysAhead);
  return new Date(berlinInclusiveDateRange(ymd, ymd).start.getTime() + hour * 3_600_000);
}

/**
 * Insert a SECRET_CODE event with two future same-day slots (morning 1 credit, evening 4).
 * Reuses an existing partner + image so Playwright does not need R2.
 */
export async function createPricedSlotEvent(options?: {
  title?: string;
  daysAhead?: number;
  morningHour?: number;
  eveningHour?: number;
  morningPrice?: number;
  eveningPrice?: number;
}): Promise<{ id: string; title: string; morning: Date; evening: Date }> {
  const db = createDb(requireDatabaseUrl());
  const template = await db.query.events.findFirst();
  if (!template) {
    throw new Error("No events in catalog — run bun run seed:demo");
  }
  const partnerRows = await listPartners(db, { limit: 1 });
  const partner = partnerRows[0];
  if (!partner) {
    throw new Error("No partners in catalog — run bun run seed:demo");
  }

  const daysAhead = options?.daysAhead ?? 14;
  const morningHour = options?.morningHour ?? 10;
  const eveningHour = options?.eveningHour ?? 18;
  const morningPrice = options?.morningPrice ?? 1;
  const eveningPrice = options?.eveningPrice ?? 4;
  const title =
    options?.title ?? `E2E Slot ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const morning = berlinWallClock(daysAhead, morningHour);
  const evening = berlinWallClock(daysAhead, eveningHour);

  const [created] = await db
    .insert(events)
    .values({
      partnerId: partner.id,
      partnerName: partner.name,
      title,
      titleDe: title,
      titleEn: title,
      description: "E2E multi-slot priced occurrences",
      descriptionDe: "E2E multi-slot priced occurrences",
      descriptionEn: "E2E multi-slot priced occurrences",
      address: partner.address || "Berlin",
      street: template.street || "E2E Straße",
      houseNumber: template.houseNumber || "1",
      addressLine2: template.addressLine2,
      country: "DE",
      city: "berlin",
      zipCode: template.zipCode || "10115",
      imageId: template.imageId,
      category: template.category || "theater",
      eventType: template.eventType || "theater_play",
      tags: ["e2e", "slots"],
      dateTimes: [morning, evening],
      dateTime: morning,
      timingMode: template.timingMode,
      startTimeMinutes: morningHour * 60,
      weekday: morning.getDay(),
      occurrenceCreditPrices: [morningPrice, eveningPrice],
      creditPrice: morningPrice,
      capacityMode: "SHARED",
      occurrenceCapacities: [20, 20],
      totalCapacity: 20,
      remainingCapacity: 20,
      ticketType: "SECRET_CODE",
      secretCode: `SLOT${Date.now().toString(36).slice(-6).toUpperCase()}`,
      languages: ["de", "en"],
      hasSubtitles: false,
      subtitleLanguages: null,
      lat: template.lat,
      lng: template.lng,
      published: true,
    })
    .returning();

  if (!created) {
    throw new Error("Failed to insert priced-slot e2e event");
  }
  return { id: created.id, title, morning, evening };
}

/**
 * Insert a unique-titled SECRET_CODE event (single future slot) for admin Bookings / cancel-all e2e.
 * Reuses an existing partner + image so Playwright does not need R2.
 * Never reuse the shared waitlist demo title — cancel-all would break other specs.
 */
export async function createSecretCodeE2eEvent(options?: {
  title?: string;
  remainingCapacity?: number;
  totalCapacity?: number;
  creditPrice?: number;
  daysAhead?: number;
  /** Default true so member/public booking surfaces can see the event. */
  published?: boolean;
}): Promise<{ id: string; title: string }> {
  const db = createDb(requireDatabaseUrl());
  const template = await db.query.events.findFirst();
  if (!template) {
    throw new Error("No events in catalog — run bun run seed:demo");
  }
  const partnerRows = await listPartners(db, { limit: 1 });
  const partner = partnerRows[0];
  if (!partner) {
    throw new Error("No partners in catalog — run bun run seed:demo");
  }

  const totalCapacity = options?.totalCapacity ?? 8;
  const remainingCapacity = options?.remainingCapacity ?? totalCapacity;
  const creditPrice = options?.creditPrice ?? 2;
  const daysAhead = options?.daysAhead ?? 21;
  const title =
    options?.title ?? `E2E Bookings ${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const dateTime = berlinWallClock(daysAhead, 20);

  const [created] = await db
    .insert(events)
    .values({
      partnerId: partner.id,
      partnerName: partner.name,
      title,
      titleDe: title,
      titleEn: title,
      description: "E2E admin event bookings fixture",
      descriptionDe: "E2E admin event bookings fixture",
      descriptionEn: "E2E admin event bookings fixture",
      address: partner.address || "Berlin",
      street: template.street || "E2E Straße",
      houseNumber: template.houseNumber || "1",
      addressLine2: template.addressLine2,
      country: "DE",
      city: "berlin",
      zipCode: template.zipCode || "10115",
      imageId: template.imageId,
      category: template.category || "theater",
      eventType: template.eventType || "theater_play",
      tags: ["e2e", "admin-bookings"],
      dateTimes: [dateTime],
      dateTime,
      timingMode: template.timingMode,
      startTimeMinutes: 20 * 60,
      weekday: dateTime.getDay(),
      occurrenceCreditPrices: [creditPrice],
      creditPrice,
      capacityMode: "SHARED",
      occurrenceCapacities: [totalCapacity],
      totalCapacity,
      remainingCapacity,
      ticketType: "SECRET_CODE",
      secretCode: `BK${Date.now().toString(36).slice(-6).toUpperCase()}`,
      languages: ["de", "en"],
      hasSubtitles: false,
      subtitleLanguages: null,
      lat: template.lat,
      lng: template.lng,
      published: options?.published ?? true,
    })
    .returning();

  if (!created) {
    throw new Error("Failed to insert admin-bookings e2e event");
  }
  return { id: created.id, title };
}

/** Harness-only publish toggle — specs must not `import("@unveiled/db")` (Playwright ESM). */
export async function setE2eEventPublished(eventId: string, published: boolean): Promise<void> {
  await setEventPublished(createDb(requireDatabaseUrl()), eventId, published);
}

/** Add (or reuse) a featured-event row and set its featured publish flag. */
export async function ensureE2eFeaturedEvent(
  eventId: string,
  featuredPublished: boolean,
): Promise<void> {
  const db = createDb(requireDatabaseUrl());
  try {
    await addFeaturedEvent(db, eventId);
  } catch {
    // already featured
  }
  await setFeaturedEventPublished(db, eventId, featuredPublished);
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

function shiftOccurrencesToFuture(dateTimes: Date[], daysAhead = 14): Date[] {
  const nowMs = Date.now();
  if (dateTimes.some((value) => value.getTime() >= nowMs)) {
    return dateTimes;
  }
  const earliest = Math.min(...dateTimes.map((value) => value.getTime()));
  const shift = nowMs + daysAhead * 86_400_000 - earliest;
  return dateTimes.map((value) => new Date(value.getTime() + shift));
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
  const nextDates = shiftOccurrencesToFuture(row.dateTimes);
  const datesStale = nextDates.some(
    (value, index) => value.getTime() !== row.dateTimes[index]?.getTime(),
  );
  const patch: {
    totalCapacity?: number;
    remainingCapacity?: number;
    dateTimes?: Date[];
    dateTime?: Date;
    updatedAt: Date;
  } = { updatedAt: new Date() };
  if (row.remainingCapacity < minRemaining) {
    patch.totalCapacity = Math.max(row.totalCapacity, minRemaining);
    patch.remainingCapacity = minRemaining;
  }
  if (datesStale) {
    patch.dateTimes = nextDates;
    patch.dateTime = nextDates[0];
  }
  if (patch.totalCapacity !== undefined || datesStale) {
    await db.update(events).set(patch).where(eq(events.id, row.id));
  }

  if (row.ticketType === "VOUCHER_PROMO" || row.ticketType === "VOUCHER_PDF") {
    await ensureVoucherInventoryAvailable(db, row.id, row.ticketType, minRemaining);
  }

  return row.id;
}

/** Sample Mon–Sun week for discovery e2e (mix of open + closed days). */
export const E2E_SAMPLE_OPENING_HOURS: OpeningHoursWeek = {
  mon: { open: "10:00", close: "18:00" },
  tue: { open: "10:00", close: "18:00" },
  wed: { closed: true },
  thu: { open: "12:00", close: "20:00" },
  fri: { open: "10:00", close: "22:00" },
  sat: { open: "11:00", close: "16:00" },
  sun: { closed: true },
};

/**
 * Temporarily set (or clear) a partner's published opening hours, restoring prior values after `fn`.
 * Uses a direct column update (avoids `updatePartner` image-pipeline import in Playwright).
 */
export async function withPartnerOpeningHours(
  partnerName: string,
  hours: OpeningHoursWeek | null,
  fn: () => Promise<void>,
): Promise<void> {
  const db = createDb(requireDatabaseUrl());
  const partnerId = await getPartnerIdByName(partnerName);
  const existing = await getPartnerById(db, partnerId);
  if (!existing) {
    throw new Error(`Partner not found: ${partnerName}`);
  }

  const previous = {
    hasOpeningHours: existing.hasOpeningHours,
    openingHours: existing.openingHours ?? null,
  };

  try {
    await db
      .update(partners)
      .set({
        hasOpeningHours: hours != null,
        openingHours: hours,
        updatedAt: new Date(),
      })
      .where(eq(partners.id, partnerId));
    await fn();
  } finally {
    await db
      .update(partners)
      .set({
        hasOpeningHours: previous.hasOpeningHours,
        openingHours: previous.openingHours,
        updatedAt: new Date(),
      })
      .where(eq(partners.id, partnerId));
  }
}

/**
 * Temporarily set a partner's barrier-free flag, restoring the prior value after `fn`.
 * Uses a direct column update (avoids `updatePartner` image-pipeline import in Playwright).
 */
export async function withPartnerBarrierFree(
  partnerName: string,
  barrierFree: boolean | null,
  fn: () => Promise<void>,
): Promise<void> {
  const db = createDb(requireDatabaseUrl());
  const partnerId = await getPartnerIdByName(partnerName);
  const existing = await getPartnerById(db, partnerId);
  if (!existing) {
    throw new Error(`Partner not found: ${partnerName}`);
  }

  const previous = existing.barrierFree ?? null;

  try {
    await db
      .update(partners)
      .set({
        barrierFree,
        updatedAt: new Date(),
      })
      .where(eq(partners.id, partnerId));
    await fn();
  } finally {
    await db
      .update(partners)
      .set({
        barrierFree: previous,
        updatedAt: new Date(),
      })
      .where(eq(partners.id, partnerId));
  }
}

/**
 * Temporarily set an event's primary-image credit, restoring the prior value after `fn`.
 * Direct column update (avoids `@unveiled/db/catalog/images` / WASM in Playwright).
 */
export async function withEventPrimaryCredit(
  eventId: string,
  credit: string | null,
  fn: () => Promise<void>,
): Promise<void> {
  const db = createDb(requireDatabaseUrl());
  const event = await getEventById(db, eventId);
  if (!event) {
    throw new Error(`Event not found: ${eventId}`);
  }

  const existing = await db.query.images.findFirst({
    where: eq(images.id, event.imageId),
    columns: { credit: true },
  });
  if (!existing) {
    throw new Error(`Primary image not found for event: ${eventId}`);
  }
  const previous = existing.credit ?? null;

  try {
    await db.update(images).set({ credit }).where(eq(images.id, event.imageId));
    await fn();
  } finally {
    await db.update(images).set({ credit: previous }).where(eq(images.id, event.imageId));
  }
}

/**
 * Temporarily set the first gallery image's credit, restoring the prior value after `fn`.
 */
export async function withGalleryImageCredit(
  eventId: string,
  credit: string | null,
  fn: () => Promise<void>,
): Promise<void> {
  const db = createDb(requireDatabaseUrl());
  const gallery = await listEventGalleryImages(db, eventId);
  const first = gallery[0];
  if (!first) {
    throw new Error(`Event has no gallery images: ${eventId}`);
  }
  const previous = first.credit ?? null;

  try {
    await db.update(images).set({ credit }).where(eq(images.id, first.imageId));
    await fn();
  } finally {
    await db.update(images).set({ credit: previous }).where(eq(images.id, first.imageId));
  }
}

/**
 * Insert a historical CONFIRMED booking with tickets_count > 1 (cannot be created via checkout).
 * Used for grandfathered multi-ticket display on My Tickets.
 */
export async function seedGrandfatheredPromoBooking(email: string, title: string): Promise<void> {
  const db = createDb(requireDatabaseUrl());
  const userId = await getUserIdByEmail(email);
  const eventId = await getEventIdByTitle(title);
  const event = await getEventById(db, eventId);
  if (!event) {
    throw new Error(`Event not found: ${title}`);
  }

  const [booking] = await db
    .insert(bookings)
    .values({
      userId,
      eventId: event.id,
      partnerId: event.partnerId,
      ticketsCount: 2,
      totalCredits: event.creditPrice * 2,
      dateTime: event.dateTime,
      status: "CONFIRMED",
      redemptionType: "VOUCHER_PROMO",
      redemptionInfo: "E2E-GRANDFATHER-1",
      idempotencyKey: `e2e-grandfather-${crypto.randomUUID()}`,
    })
    .returning();

  if (!booking) {
    throw new Error("Failed to insert grandfathered promo booking");
  }

  await db.insert(bookingTickets).values([
    { bookingId: booking.id, ordinal: 1, redemptionCode: "E2E-GRANDFATHER-1" },
    { bookingId: booking.id, ordinal: 2, redemptionCode: "E2E-GRANDFATHER-2" },
  ]);
}
