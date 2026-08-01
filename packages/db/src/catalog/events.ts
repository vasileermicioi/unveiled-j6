import type { PrebuiltImageVariantsInput } from "@unveiled/images";
import { and, asc, count, desc, eq, gt, gte, ilike, or, type SQL, sql } from "drizzle-orm";

import type { Db } from "../index";
import { validatePostalCode } from "../location";
import { eventGalleryImages } from "../schema/event-gallery-images";
import { type Event, events, type TicketType, type TimingMode } from "../schema/events";
import { deriveDateTimeFields } from "./datetime";
import { CatalogValidationError } from "./errors";
import { resolveEventLanguages } from "./language-filter";
import { getPartnerById } from "./partners";
import {
  applyEventDefaults,
  requireNonEmpty,
  validateImageSourceExclusive,
  validateRedemptionConfig,
} from "./validation";
import {
  applyVoucherInventory,
  assertVoucherInventoryPresent,
  type VoucherInventoryPayload,
} from "./voucher-inventory";

/** Lazy — keeps `@unveiled/images` / sip out of client graphs that import `@unveiled/db`. */
function catalogImages() {
  return import("./images");
}

/** Lazy — avoids cycle with `event-gallery-images` (imports `getEventById`). */
function catalogGallery() {
  return import("./event-gallery-images");
}

export type ListEventsOptions = {
  limit?: number;
  offset?: number;
  q?: string;
  partnerId?: string;
};

export type CreateEventInput = {
  partnerId: string;
  title: string;
  description: string;
  address: string;
  zipCode: string;
  country?: string | null;
  city?: string | null;
  imageUpload?: Buffer | null;
  imageUrl?: string | null;
  imagePrebuilt?: PrebuiltImageVariantsInput | null;
  /**
   * Already-persisted primary image id (error-form retry).
   * Ignored when `imagePrebuilt` is present (new prebuilt wins).
   */
  stagedImageId?: string | null;
  category: string;
  eventType: string;
  tags?: string[];
  dateTime: Date;
  timingMode?: TimingMode | null;
  creditPrice: number;
  totalCapacity?: number | null;
  ticketType?: TicketType | null;
  secretCode?: string | null;
  eventWebsiteUrl?: string | null;
  barrierFree?: boolean | null;
  languageIndependent?: boolean;
  languages?: string[] | null;
  targetAgeGroups?: string[] | null;
  lat?: string | null;
  lng?: string | null;
  uploadedBy?: string | null;
  skipUpload?: boolean;
};

export type UpdateEventInput = {
  partnerId?: string;
  title?: string;
  description?: string;
  address?: string;
  zipCode?: string;
  country?: string | null;
  city?: string | null;
  imageUpload?: Buffer | null;
  imageUrl?: string | null;
  imagePrebuilt?: PrebuiltImageVariantsInput | null;
  /**
   * Already-persisted replacement image id (error-form retry).
   * Ignored when `imagePrebuilt` is present (new prebuilt wins).
   */
  stagedImageId?: string | null;
  category?: string;
  eventType?: string;
  tags?: string[];
  dateTime?: Date;
  timingMode?: TimingMode | null;
  creditPrice?: number;
  totalCapacity?: number;
  ticketType?: TicketType | null;
  secretCode?: string | null;
  eventWebsiteUrl?: string | null;
  barrierFree?: boolean | null;
  languageIndependent?: boolean;
  languages?: string[] | null;
  targetAgeGroups?: string[] | null;
  lat?: string | null;
  lng?: string | null;
  uploadedBy?: string | null;
  skipUpload?: boolean;
};

/**
 * Clone an existing catalog event into a new row.
 * Caller supplies `dateTime`; voucher types require create-mode inventory (not copied from source).
 */
export type CloneEventInput = {
  dateTime: Date;
  voucherInventory?: VoucherInventoryPayload;
};

export function recalculateRemainingCapacity(
  currentTotalCapacity: number,
  currentRemainingCapacity: number,
  newTotalCapacity: number,
): number {
  const soldCount = currentTotalCapacity - currentRemainingCapacity;
  return Math.max(0, newTotalCapacity - soldCount);
}

export function exportRedemptionCodesCsv(_eventId: string): string {
  return "booking_id,redemption_code,status\n";
}

export async function getEventById(db: Db, eventId: string): Promise<Event | null> {
  return (
    (await db.query.events.findFirst({
      where: eq(events.id, eventId),
    })) ?? null
  );
}

export async function getPublicEventById(db: Db, eventId: string): Promise<Event | null> {
  return getEventById(db, eventId);
}

export type ListUpcomingEventsOptions = {
  limit?: number;
  now?: Date;
};

export async function listUpcomingEvents(
  db: Db,
  options: ListUpcomingEventsOptions = {},
): Promise<Event[]> {
  const now = options.now ?? new Date();
  const limit = options.limit ?? 6;

  return db
    .select()
    .from(events)
    .where(gte(events.dateTime, now))
    .orderBy(asc(events.dateTime))
    .limit(limit);
}

/** Bookable = future date_time and remaining_capacity > 0 (same as public event indexability). */
export type SitemapEventRow = {
  id: string;
  updatedAt: Date;
};

export type ListBookableEventsForSitemapOptions = {
  now?: Date;
  /** Soft upper bound for MVP catalog size; default 5000. */
  limit?: number;
};

export async function listBookableEventsForSitemap(
  db: Db,
  options: ListBookableEventsForSitemapOptions = {},
): Promise<SitemapEventRow[]> {
  const now = options.now ?? new Date();
  const limit = options.limit ?? 5000;

  return db
    .select({
      id: events.id,
      updatedAt: events.updatedAt,
    })
    .from(events)
    .where(and(gt(events.dateTime, now), gt(events.remainingCapacity, 0)))
    .orderBy(asc(events.dateTime))
    .limit(limit);
}

function eventSearchCondition(q?: string): SQL | undefined {
  const search = q?.trim();
  if (!search) {
    return undefined;
  }

  const pattern = `%${search}%`;
  return or(ilike(events.title, pattern), ilike(events.partnerName, pattern));
}

export async function listEvents(db: Db, options: ListEventsOptions = {}): Promise<Event[]> {
  const limit = options.limit ?? 25;
  const offset = options.offset ?? 0;
  const conditions: SQL[] = [];

  if (options.partnerId) {
    conditions.push(eq(events.partnerId, options.partnerId));
  }

  const searchCondition = eventSearchCondition(options.q);
  if (searchCondition) {
    conditions.push(searchCondition);
  }

  let query = db.select().from(events).$dynamic();
  if (conditions.length === 1) {
    query = query.where(conditions[0]);
  } else if (conditions.length > 1) {
    query = query.where(and(...conditions));
  }

  return query.orderBy(desc(events.createdAt), desc(events.id)).limit(limit).offset(offset);
}

async function resolvePartner(db: Db, partnerId: string) {
  const partner = await getPartnerById(db, partnerId);
  if (!partner) {
    throw new CatalogValidationError("PARTNER_NOT_FOUND", `Partner ${partnerId} not found`);
  }
  return partner;
}

type CreatePrimaryImageInput = Pick<
  CreateEventInput,
  "imageUpload" | "imageUrl" | "imagePrebuilt" | "stagedImageId" | "uploadedBy" | "skipUpload"
>;

/**
 * Persist-before-domain: stage a new prebuilt set first, else reuse a staged id.
 * Complete `imagePrebuilt` always wins over `stagedImageId`.
 * Does not delete staged images on later domain failure (retry-friendly).
 */
async function resolveCreatePrimaryImageId(
  db: Db,
  input: CreatePrimaryImageInput,
): Promise<string> {
  if (input.imagePrebuilt != null) {
    validateImageSourceExclusive(input.imageUpload, input.imageUrl, {
      required: true,
      prebuilt: input.imagePrebuilt,
    });
    const { attachImageToEvent } = await catalogImages();
    return attachImageToEvent(db, input.imageUpload, input.imageUrl, {
      uploadedBy: input.uploadedBy,
      skipUpload: input.skipUpload,
      prebuilt: input.imagePrebuilt,
    });
  }

  const stagedImageId = input.stagedImageId?.trim();
  if (stagedImageId) {
    if (
      (input.imageUpload != null && input.imageUpload.length > 0) ||
      (input.imageUrl != null && input.imageUrl.trim().length > 0)
    ) {
      throw new CatalogValidationError(
        "CLIENT_IMAGE_REQUIRED",
        "Image variants must be generated in the browser before submit",
      );
    }
    const { assertImageExists } = await catalogImages();
    await assertImageExists(db, stagedImageId);
    return stagedImageId;
  }

  validateImageSourceExclusive(input.imageUpload, input.imageUrl, { required: true });
  throw new CatalogValidationError("MISSING_EVENT_IMAGE", "Event image is required");
}

/**
 * Prefer new prebuilt persist, else a staged replacement id, else keep current.
 */
async function resolveUpdatePrimaryImageId(
  db: Db,
  currentImageId: string,
  input: UpdateEventInput,
): Promise<string> {
  if (input.imagePrebuilt != null) {
    validateImageSourceExclusive(input.imageUpload, input.imageUrl, {
      prebuilt: input.imagePrebuilt,
    });
    const { replaceEventImage } = await catalogImages();
    return replaceEventImage(db, currentImageId, input.imageUpload, input.imageUrl, {
      uploadedBy: input.uploadedBy,
      skipUpload: input.skipUpload,
      prebuilt: input.imagePrebuilt,
    });
  }

  const stagedImageId = input.stagedImageId?.trim();
  if (stagedImageId && stagedImageId !== currentImageId) {
    if (
      (input.imageUpload != null && input.imageUpload.length > 0) ||
      (input.imageUrl != null && input.imageUrl.trim().length > 0)
    ) {
      throw new CatalogValidationError(
        "CLIENT_IMAGE_REQUIRED",
        "Image variants must be generated in the browser before submit",
      );
    }
    const { assertImageExists } = await catalogImages();
    await assertImageExists(db, stagedImageId);
    return stagedImageId;
  }

  validateImageSourceExclusive(input.imageUpload, input.imageUrl, {
    prebuilt: input.imagePrebuilt,
  });
  return currentImageId;
}

async function insertEventRow(
  db: Db,
  input: CreateEventInput,
  partnerName: string,
  imageId: string,
): Promise<Event> {
  const defaults = applyEventDefaults(input);
  validateRedemptionConfig({
    ticketType: defaults.ticketType,
    secretCode: input.secretCode,
    eventWebsiteUrl: input.eventWebsiteUrl,
  });

  const location = validatePostalCode({
    country: input.country,
    city: input.city,
    zipCode: input.zipCode,
  });

  const derived = deriveDateTimeFields(input.dateTime, defaults.timingMode);

  const inserted = await db
    .insert(events)
    .values({
      partnerId: input.partnerId,
      partnerName,
      title: requireNonEmpty(input.title, "title"),
      description: requireNonEmpty(input.description, "description"),
      address: requireNonEmpty(input.address, "address"),
      country: location.country,
      city: location.city,
      zipCode: location.zipCode,
      imageId,
      category: requireNonEmpty(input.category, "category"),
      eventType: requireNonEmpty(input.eventType, "eventType"),
      tags: input.tags ?? [],
      dateTime: input.dateTime,
      timingMode: defaults.timingMode,
      startTimeMinutes: derived.startTimeMinutes,
      weekday: derived.weekday,
      creditPrice: input.creditPrice,
      totalCapacity: defaults.totalCapacity,
      remainingCapacity: defaults.totalCapacity,
      ticketType: defaults.ticketType,
      secretCode: input.secretCode?.trim() || null,
      promoCode: null,
      eventWebsiteUrl: input.eventWebsiteUrl?.trim() || null,
      barrierFree: input.barrierFree ?? null,
      languageIndependent: input.languageIndependent ?? false,
      languages: resolveEventLanguages(input.languageIndependent ?? false, input.languages),
      targetAgeGroups: input.targetAgeGroups ?? null,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
    })
    .returning();

  const event = inserted[0];
  if (!event) {
    throw new Error("Failed to create event");
  }

  return event;
}

export async function createEvent(db: Db, input: CreateEventInput): Promise<Event> {
  // Stage image before partner/row writes so validation failures keep a retry handle.
  const imageId = await resolveCreatePrimaryImageId(db, input);
  const partner = await resolvePartner(db, input.partnerId);
  return insertEventRow(db, input, partner.name, imageId);
}

/**
 * Create a distinct event from a source catalog row.
 * Copies metadata + primary image id + gallery joins; resets capacity; never copies
 * bookings, waitlist, featured membership, or voucher inventory rows.
 */
export async function cloneEvent(
  db: Db,
  sourceEventId: string,
  input: CloneEventInput,
): Promise<Event> {
  const source = await getEventById(db, sourceEventId);
  if (!source) {
    throw new CatalogValidationError("EVENT_NOT_FOUND", `Event ${sourceEventId} not found`);
  }

  const voucherInventory: VoucherInventoryPayload = input.voucherInventory ?? {
    promoCodes: [],
    pdfItems: [],
  };
  assertVoucherInventoryPresent(source.ticketType, voucherInventory, { mode: "create" });

  const partner = await resolvePartner(db, source.partnerId);
  const createInput: CreateEventInput = {
    partnerId: source.partnerId,
    title: source.title,
    description: source.description,
    address: source.address,
    zipCode: source.zipCode,
    country: source.country,
    city: source.city,
    category: source.category,
    eventType: source.eventType,
    tags: source.tags ?? [],
    dateTime: input.dateTime,
    timingMode: source.timingMode,
    creditPrice: source.creditPrice,
    totalCapacity: source.totalCapacity,
    ticketType: source.ticketType,
    secretCode: source.secretCode,
    eventWebsiteUrl: source.eventWebsiteUrl,
    barrierFree: source.barrierFree,
    languageIndependent: source.languageIndependent,
    languages: source.languages,
    targetAgeGroups: source.targetAgeGroups,
    lat: source.lat,
    lng: source.lng,
  };

  const cloned = await insertEventRow(db, createInput, partner.name, source.imageId);

  await applyVoucherInventory(db, cloned.id, source.ticketType, voucherInventory);

  const { listEventGalleryImageIds, addEventGalleryImages } = await catalogGallery();
  const galleryIds = await listEventGalleryImageIds(db, sourceEventId);
  if (galleryIds.length > 0) {
    await addEventGalleryImages(db, cloned.id, galleryIds);
  }

  return cloned;
}

export async function updateEvent(
  db: Db,
  eventId: string,
  input: UpdateEventInput,
): Promise<Event> {
  const existing = await getEventById(db, eventId);
  if (!existing) {
    throw new CatalogValidationError("EVENT_NOT_FOUND", `Event ${eventId} not found`);
  }

  // Stage replacement before redemption/row writes so failed updates keep the new image.
  const previousImageId = existing.imageId;
  const imageId = await resolveUpdatePrimaryImageId(db, existing.imageId, input);
  const hasNewImage = imageId !== previousImageId;

  const partnerId = input.partnerId ?? existing.partnerId;
  const partner = await resolvePartner(db, partnerId);

  const ticketType = input.ticketType ?? existing.ticketType;
  validateRedemptionConfig({
    ticketType,
    secretCode: input.secretCode ?? existing.secretCode,
    eventWebsiteUrl: input.eventWebsiteUrl ?? existing.eventWebsiteUrl,
  });

  const nextDateTime = input.dateTime ?? existing.dateTime;
  const nextTimingMode = input.timingMode ?? existing.timingMode;
  const derived = deriveDateTimeFields(nextDateTime, nextTimingMode);

  const nextTotalCapacity = input.totalCapacity ?? existing.totalCapacity;
  const nextRemainingCapacity =
    input.totalCapacity !== undefined
      ? recalculateRemainingCapacity(
          existing.totalCapacity,
          existing.remainingCapacity,
          input.totalCapacity,
        )
      : existing.remainingCapacity;

  const locationTouched =
    input.zipCode !== undefined || input.country !== undefined || input.city !== undefined;
  const location = locationTouched
    ? validatePostalCode({
        country: input.country !== undefined ? input.country : existing.country,
        city: input.city !== undefined ? input.city : existing.city,
        zipCode: input.zipCode !== undefined ? input.zipCode : existing.zipCode,
      })
    : {
        country: existing.country,
        city: existing.city,
        zipCode: existing.zipCode,
      };

  const updated = await db
    .update(events)
    .set({
      partnerId,
      partnerName: partner.name,
      title: input.title !== undefined ? requireNonEmpty(input.title, "title") : existing.title,
      description:
        input.description !== undefined
          ? requireNonEmpty(input.description, "description")
          : existing.description,
      address:
        input.address !== undefined ? requireNonEmpty(input.address, "address") : existing.address,
      country: location.country,
      city: location.city,
      zipCode: location.zipCode,
      imageId,
      category:
        input.category !== undefined
          ? requireNonEmpty(input.category, "category")
          : existing.category,
      eventType:
        input.eventType !== undefined
          ? requireNonEmpty(input.eventType, "eventType")
          : existing.eventType,
      tags: input.tags ?? existing.tags,
      dateTime: nextDateTime,
      timingMode: nextTimingMode,
      startTimeMinutes: derived.startTimeMinutes,
      weekday: derived.weekday,
      creditPrice: input.creditPrice ?? existing.creditPrice,
      totalCapacity: nextTotalCapacity,
      remainingCapacity: nextRemainingCapacity,
      ticketType,
      secretCode:
        input.secretCode !== undefined ? input.secretCode?.trim() || null : existing.secretCode,
      promoCode: null,
      eventWebsiteUrl:
        input.eventWebsiteUrl !== undefined
          ? input.eventWebsiteUrl?.trim() || null
          : existing.eventWebsiteUrl,
      barrierFree: input.barrierFree !== undefined ? input.barrierFree : existing.barrierFree,
      languageIndependent:
        input.languageIndependent !== undefined
          ? input.languageIndependent
          : existing.languageIndependent,
      languages: resolveEventLanguages(
        input.languageIndependent !== undefined
          ? input.languageIndependent
          : existing.languageIndependent,
        input.languages !== undefined ? input.languages : existing.languages,
      ),
      targetAgeGroups:
        input.targetAgeGroups !== undefined ? input.targetAgeGroups : existing.targetAgeGroups,
      lat: input.lat !== undefined ? input.lat : existing.lat,
      lng: input.lng !== undefined ? input.lng : existing.lng,
      updatedAt: new Date(),
    })
    .where(eq(events.id, eventId))
    .returning();

  const event = updated[0];
  if (!event) {
    throw new Error(`Failed to update event ${eventId}`);
  }

  if (hasNewImage && previousImageId !== imageId) {
    const { deleteImageRecord } = await catalogImages();
    await deleteImageRecord(db, previousImageId, { skipBucket: input.skipUpload });
  }

  return event;
}

export async function deleteEvent(
  db: Db,
  eventId: string,
  options?: { skipBucket?: boolean },
): Promise<void> {
  const existing = await getEventById(db, eventId);
  if (!existing) {
    throw new CatalogValidationError("EVENT_NOT_FOUND", `Event ${eventId} not found`);
  }

  const galleryRows = await db
    .select({ imageId: eventGalleryImages.imageId })
    .from(eventGalleryImages)
    .where(eq(eventGalleryImages.eventId, eventId));

  const imageIdsToDelete = new Set(galleryRows.map((row) => row.imageId));
  imageIdsToDelete.add(existing.imageId);

  await db.delete(events).where(eq(events.id, eventId));

  // Gap (clone-event / step 03): unlike gallery remove, deleteEvent does not
  // reference-count shared primary/gallery image ids. Clones reuse image ids —
  // deleting one event can remove images still referenced by another.
  const { deleteImageRecord } = await catalogImages();
  for (const imageId of imageIdsToDelete) {
    await deleteImageRecord(db, imageId, { skipBucket: options?.skipBucket });
  }
}

export type CountEventsOptions = {
  q?: string;
};

export async function countEvents(db: Db, options: CountEventsOptions = {}): Promise<number> {
  const searchCondition = eventSearchCondition(options.q);

  if (searchCondition) {
    const [result] = await db.select({ count: count() }).from(events).where(searchCondition);
    return result?.count ?? 0;
  }

  const [result] = await db.select({ count: count() }).from(events);
  return result?.count ?? 0;
}

export async function countUpcomingEvents(
  db: Db,
  referenceDate: Date = new Date(),
): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(events)
    .where(gte(events.dateTime, referenceDate));

  return result?.count ?? 0;
}

export async function sumRemainingCapacity(db: Db): Promise<number> {
  const [result] = await db
    .select({
      total: sql<number>`coalesce(sum(${events.remainingCapacity}), 0)::int`,
    })
    .from(events);

  return result?.total ?? 0;
}

export async function sumTotalCapacity(db: Db): Promise<number> {
  const [result] = await db
    .select({
      total: sql<number>`coalesce(sum(${events.totalCapacity}), 0)::int`,
    })
    .from(events);

  return result?.total ?? 0;
}

export type MonthlyEventCount = {
  monthKey: string;
  count: number;
};

export async function countEventsByMonth(db: Db, months = 6): Promise<MonthlyEventCount[]> {
  const safeMonths = Math.max(1, Math.min(months, 12));

  const rows = await db
    .select({
      monthKey: sql<string>`to_char(${events.dateTime}, 'YYYY-MM')`,
      count: count(),
    })
    .from(events)
    .where(gte(events.dateTime, sql`date_trunc('month', now())`))
    .groupBy(sql`to_char(${events.dateTime}, 'YYYY-MM')`)
    .orderBy(sql`to_char(${events.dateTime}, 'YYYY-MM')`)
    .limit(safeMonths);

  return rows.map((row) => ({
    monthKey: row.monthKey,
    count: row.count,
  }));
}
