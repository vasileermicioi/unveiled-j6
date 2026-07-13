import { and, asc, count, desc, eq, gt, gte, ilike, or, type SQL, sql } from "drizzle-orm";

import type { Db } from "../index";
import {
  type Event,
  events,
  type SecretCodeMode,
  type TicketType,
  type TimingMode,
} from "../schema/events";
import { deriveDateTimeFields } from "./datetime";
import { CatalogValidationError } from "./errors";
import { attachImageToEvent, deleteImageRecord, replaceEventImage } from "./images";
import { getPartnerById } from "./partners";
import {
  applyEventDefaults,
  requireNonEmpty,
  validateImageSourceExclusive,
  validateRedemptionConfig,
  validateUniqueSeriesSlots,
} from "./validation";

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
  neighborhood: string;
  imageUpload?: Buffer | null;
  imageUrl?: string | null;
  category: string;
  eventType: string;
  tags?: string[];
  dateTime: Date;
  timingMode?: TimingMode | null;
  creditPrice: number;
  totalCapacity?: number | null;
  ticketType?: TicketType | null;
  secretCodeMode?: SecretCodeMode | null;
  secretCode?: string | null;
  promoCode?: string | null;
  eventWebsiteUrl?: string | null;
  barrierFree?: boolean | null;
  languages?: string[] | null;
  targetAgeGroups?: string[] | null;
  lat?: string | null;
  lng?: string | null;
  mapZoom?: number | null;
  uploadedBy?: string | null;
  skipUpload?: boolean;
};

export type UpdateEventInput = {
  partnerId?: string;
  title?: string;
  description?: string;
  address?: string;
  neighborhood?: string;
  imageUpload?: Buffer | null;
  imageUrl?: string | null;
  category?: string;
  eventType?: string;
  tags?: string[];
  dateTime?: Date;
  timingMode?: TimingMode | null;
  creditPrice?: number;
  totalCapacity?: number;
  ticketType?: TicketType | null;
  secretCodeMode?: SecretCodeMode | null;
  secretCode?: string | null;
  promoCode?: string | null;
  eventWebsiteUrl?: string | null;
  barrierFree?: boolean | null;
  languages?: string[] | null;
  targetAgeGroups?: string[] | null;
  lat?: string | null;
  lng?: string | null;
  mapZoom?: number | null;
  uploadedBy?: string | null;
  skipUpload?: boolean;
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

async function insertEventRow(
  db: Db,
  input: CreateEventInput,
  partnerName: string,
  imageId: string,
): Promise<Event> {
  const defaults = applyEventDefaults(input);
  validateRedemptionConfig({
    ticketType: defaults.ticketType,
    secretCodeMode: defaults.secretCodeMode,
    secretCode: input.secretCode,
    promoCode: input.promoCode,
    eventWebsiteUrl: input.eventWebsiteUrl,
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
      neighborhood: requireNonEmpty(input.neighborhood, "neighborhood"),
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
      secretCodeMode: defaults.secretCodeMode,
      secretCode: input.secretCode?.trim() || null,
      promoCode: input.promoCode?.trim() || null,
      eventWebsiteUrl: input.eventWebsiteUrl?.trim() || null,
      barrierFree: input.barrierFree ?? null,
      languages: input.languages ?? null,
      targetAgeGroups: input.targetAgeGroups ?? null,
      lat: input.lat ?? null,
      lng: input.lng ?? null,
      mapZoom: input.mapZoom ?? null,
    })
    .returning();

  const event = inserted[0];
  if (!event) {
    throw new Error("Failed to create event");
  }

  return event;
}

export async function createEvent(db: Db, input: CreateEventInput): Promise<Event> {
  validateImageSourceExclusive(input.imageUpload, input.imageUrl, { required: true });
  const partner = await resolvePartner(db, input.partnerId);

  const imageId = await attachImageToEvent(db, input.imageUpload, input.imageUrl, {
    uploadedBy: input.uploadedBy,
    skipUpload: input.skipUpload,
  });

  try {
    return await insertEventRow(db, input, partner.name, imageId);
  } catch (error) {
    await deleteImageRecord(db, imageId, { skipBucket: input.skipUpload });
    throw error;
  }
}

export async function createEventSeries(
  db: Db,
  input: Omit<CreateEventInput, "dateTime"> & { slots: Date[] },
): Promise<Event[]> {
  validateImageSourceExclusive(input.imageUpload, input.imageUrl, { required: true });
  const partner = await resolvePartner(db, input.partnerId);
  const slots = validateUniqueSeriesSlots(input.slots);

  const imageId = await attachImageToEvent(db, input.imageUpload, input.imageUrl, {
    uploadedBy: input.uploadedBy,
    skipUpload: input.skipUpload,
  });

  const created: Event[] = [];
  for (const slot of slots) {
    const event = await insertEventRow(
      db,
      {
        ...input,
        dateTime: slot,
      },
      partner.name,
      imageId,
    );
    created.push(event);
  }

  return created;
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

  validateImageSourceExclusive(input.imageUpload, input.imageUrl);

  const partnerId = input.partnerId ?? existing.partnerId;
  const partner = await resolvePartner(db, partnerId);

  const ticketType = input.ticketType ?? existing.ticketType;
  const secretCodeMode = input.secretCodeMode ?? existing.secretCodeMode;
  validateRedemptionConfig({
    ticketType,
    secretCodeMode,
    secretCode: input.secretCode ?? existing.secretCode,
    promoCode: input.promoCode ?? existing.promoCode,
    eventWebsiteUrl: input.eventWebsiteUrl ?? existing.eventWebsiteUrl,
  });

  let imageId = existing.imageId;
  const previousImageId = existing.imageId;
  const hasNewImage =
    (input.imageUpload != null && input.imageUpload.length > 0) ||
    (input.imageUrl != null && input.imageUrl.trim().length > 0);

  if (hasNewImage) {
    imageId = await replaceEventImage(db, existing.imageId, input.imageUpload, input.imageUrl, {
      uploadedBy: input.uploadedBy,
      skipUpload: input.skipUpload,
    });
  }

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
      neighborhood:
        input.neighborhood !== undefined
          ? requireNonEmpty(input.neighborhood, "neighborhood")
          : existing.neighborhood,
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
      secretCodeMode,
      secretCode:
        input.secretCode !== undefined ? input.secretCode?.trim() || null : existing.secretCode,
      promoCode:
        input.promoCode !== undefined ? input.promoCode?.trim() || null : existing.promoCode,
      eventWebsiteUrl:
        input.eventWebsiteUrl !== undefined
          ? input.eventWebsiteUrl?.trim() || null
          : existing.eventWebsiteUrl,
      barrierFree: input.barrierFree !== undefined ? input.barrierFree : existing.barrierFree,
      languages: input.languages !== undefined ? input.languages : existing.languages,
      targetAgeGroups:
        input.targetAgeGroups !== undefined ? input.targetAgeGroups : existing.targetAgeGroups,
      lat: input.lat !== undefined ? input.lat : existing.lat,
      lng: input.lng !== undefined ? input.lng : existing.lng,
      mapZoom: input.mapZoom !== undefined ? input.mapZoom : existing.mapZoom,
      updatedAt: new Date(),
    })
    .where(eq(events.id, eventId))
    .returning();

  const event = updated[0];
  if (!event) {
    throw new Error(`Failed to update event ${eventId}`);
  }

  if (hasNewImage && previousImageId !== imageId) {
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

  await db.delete(events).where(eq(events.id, eventId));
  await deleteImageRecord(db, existing.imageId, { skipBucket: options?.skipBucket });
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
