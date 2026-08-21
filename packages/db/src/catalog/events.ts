import type { PrebuiltImageVariantsInput } from "@unveiled/images";
import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  ilike,
  notExists,
  or,
  type SQL,
  sql,
} from "drizzle-orm";

import type { Db } from "../index";
import { composeDisplayAddress, validatePostalCode } from "../location";
import { eventGalleryImages } from "../schema/event-gallery-images";
import {
  type CapacityMode,
  type Event,
  events,
  type TicketType,
  type TimingMode,
} from "../schema/events";
import { featuredEvents } from "../schema/featured-events";
import {
  deriveDateTimeFields,
  fillOccurrenceCapacities,
  type NormalizedEventOccurrences,
  type NormalizeOccurrencesResult,
  tryFillOccurrenceCreditsFromPrice,
  tryNormalizePairedDateTimesAndCapacities,
  tryNormalizePairedDateTimesAndCredits,
  tryNormalizePairedDateTimesCreditsAndCapacities,
} from "./datetime";
import { CatalogValidationError } from "./errors";
import {
  eventTitleLocaleIlike,
  resolveEventCopyFields,
  resolveUpdatedEventCopyFields,
} from "./event-copy";
import { resolveEventSubtitles } from "./event-subtitles";
import { assertEventCategory, assertEventType } from "./event-taxonomy";
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

/** URL-stable sort keys for the admin event list. */
export type EventSort = "title" | "partner" | "date" | "created" | "capacity";

export type ListEventsOptions = {
  limit?: number;
  offset?: number;
  /** Combined title/partner substring search (featured-add and legacy). */
  q?: string;
  /** Case-insensitive substring filter on `title_de` or `title_en` (admin events list). */
  title?: string;
  /** Case-insensitive substring filter on denormalized partner name. */
  partner?: string;
  /**
   * Language code filter: matches spoken `languages` (case-insensitive) or
   * `subtitle_languages` (case-insensitive). Empty/omitted = no language filter.
   */
  language?: string;
  partnerId?: string;
  sort?: EventSort;
  /** When `sort` is set, defaults to ascending (`false`). Ignored when `sort` is omitted. */
  desc?: boolean;
  /** When true, omit events that already have a `featured_events` row. */
  excludeFeatured?: boolean;
};

export type CreateEventInput = {
  partnerId: string;
  /** Legacy single-field posts; ignored when locale fields are set. */
  title?: string | null;
  description?: string | null;
  titleDe?: string | null;
  titleEn?: string | null;
  descriptionDe?: string | null;
  descriptionEn?: string | null;
  street: string;
  houseNumber: string;
  addressLine2?: string | null;
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
  /** Optional human photo credit for the primary image. */
  imageCredit?: string | null;
  category: string;
  eventType: string;
  tags?: string[];
  /** Non-empty occurrence list; sorted unique on write. Primary `date_time` derived from this. */
  dateTimes: Date[];
  /**
   * Optional parallel credits (same length as `dateTimes` before normalize).
   * When omitted, every slot is filled from `creditPrice`.
   */
  occurrenceCreditPrices?: number[];
  /** Injected clock for primary/next derivation in tests; defaults to `new Date()`. */
  now?: Date;
  timingMode?: TimingMode | null;
  creditPrice: number;
  totalCapacity?: number | null;
  /** When omitted, defaults to `SHARED`. */
  capacityMode?: CapacityMode | null;
  /**
   * Optional parallel capacities (same length as `dateTimes` before normalize).
   * Required when `capacityMode` is `PER_OCCURRENCE`. Ignored in `SHARED` (filled from `totalCapacity`).
   */
  occurrenceCapacities?: number[];
  ticketType?: TicketType | null;
  secretCode?: string | null;
  eventWebsiteUrl?: string | null;
  languageIndependent?: boolean;
  languages?: string[] | null;
  hasSubtitles?: boolean;
  subtitleLanguages?: string[] | null;
  lat?: string | null;
  lng?: string | null;
  uploadedBy?: string | null;
  skipUpload?: boolean;
};

export type UpdateEventInput = {
  partnerId?: string;
  title?: string;
  description?: string;
  titleDe?: string | null;
  titleEn?: string | null;
  descriptionDe?: string | null;
  descriptionEn?: string | null;
  street?: string;
  houseNumber?: string;
  addressLine2?: string | null;
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
  /** Optional human photo credit; keep-file / staged-id calls `updateImageCredit`. */
  imageCredit?: string | null;
  category?: string;
  eventType?: string;
  tags?: string[];
  /** When set, replaces the full occurrence list (non-empty after normalize). */
  dateTimes?: Date[];
  /**
   * Optional parallel credits. When set, paired with `dateTimes` or the stored list.
   * When omitted and `dateTimes` or `creditPrice` is set, fills from that single price.
   */
  occurrenceCreditPrices?: number[];
  /** Injected clock for primary/next derivation when `dateTimes` is written. */
  now?: Date;
  timingMode?: TimingMode | null;
  creditPrice?: number;
  totalCapacity?: number;
  /** When omitted, keeps the stored mode. */
  capacityMode?: CapacityMode | null;
  /**
   * Optional parallel capacities. Required when switching to or writing `PER_OCCURRENCE`.
   * Ignored in `SHARED` (filled from `totalCapacity`).
   */
  occurrenceCapacities?: number[];
  ticketType?: TicketType | null;
  secretCode?: string | null;
  eventWebsiteUrl?: string | null;
  languageIndependent?: boolean;
  languages?: string[] | null;
  hasSubtitles?: boolean;
  subtitleLanguages?: string[] | null;
  lat?: string | null;
  lng?: string | null;
  uploadedBy?: string | null;
  skipUpload?: boolean;
};

/**
 * Clone an existing catalog event into a new row.
 * Caller supplies `dateTimes`; voucher types require create-mode inventory (not copied from source).
 */
export type CloneEventInput = {
  dateTimes: Date[];
  /** When omitted, unique-sort `dateTimes` and fill every credit from `source.creditPrice`. */
  occurrenceCreditPrices?: number[];
  /** When omitted, copies `source.timingMode`. */
  timingMode?: TimingMode;
  /** When omitted, copies `source.capacityMode`. */
  capacityMode?: CapacityMode;
  /**
   * When omitted and mode is `SHARED`, fill from `source.totalCapacity` (or posted `totalCapacity`).
   * When omitted and mode is `PER_OCCURRENCE`, copy `source.occurrenceCapacities` (length must match).
   */
  occurrenceCapacities?: number[];
  /** When omitted, copies `source.totalCapacity`. Used as the SHARED pool. */
  totalCapacity?: number;
  now?: Date;
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
  return or(eventTitleLocaleIlike(pattern), ilike(events.partnerName, pattern));
}

function eventTitleCondition(title?: string): SQL | undefined {
  const search = title?.trim();
  if (!search) {
    return undefined;
  }
  return eventTitleLocaleIlike(`%${search}%`);
}

function eventPartnerNameCondition(partner?: string): SQL | undefined {
  const search = partner?.trim();
  if (!search) {
    return undefined;
  }
  return ilike(events.partnerName, `%${search}%`);
}

/**
 * Match spoken languages array or any subtitle language (case-insensitive).
 * Does not auto-include language-independent events — those only match via subtitle.
 */
function eventLanguageFilterCondition(language?: string): SQL | undefined {
  const code = language?.trim();
  if (!code) {
    return undefined;
  }
  const lower = code.toLowerCase();
  return or(
    sql`exists (select 1 from unnest(${events.languages}) as lang where lower(lang) = ${lower})`,
    sql`exists (select 1 from unnest(${events.subtitleLanguages}) as sub where lower(sub) = ${lower})`,
  );
}

function eventListFilterConditions(options: {
  q?: string;
  title?: string;
  partner?: string;
  language?: string;
  partnerId?: string;
  excludeFeatured?: boolean;
  excludeFeaturedExists?: SQL;
}): SQL[] {
  const conditions: SQL[] = [];

  if (options.partnerId) {
    conditions.push(eq(events.partnerId, options.partnerId));
  }

  if (options.excludeFeaturedExists) {
    conditions.push(options.excludeFeaturedExists);
  }

  const titleCondition = eventTitleCondition(options.title);
  const partnerCondition = eventPartnerNameCondition(options.partner);
  if (titleCondition) {
    conditions.push(titleCondition);
  }
  if (partnerCondition) {
    conditions.push(partnerCondition);
  }
  // Combined `q` only when dedicated title/partner filters are unused (featured-add).
  if (!titleCondition && !partnerCondition) {
    const searchCondition = eventSearchCondition(options.q);
    if (searchCondition) {
      conditions.push(searchCondition);
    }
  }

  const languageCondition = eventLanguageFilterCondition(options.language);
  if (languageCondition) {
    conditions.push(languageCondition);
  }

  return conditions;
}

function eventListOrderBy(sort: EventSort | undefined, descending: boolean): SQL[] {
  if (!sort) {
    return [desc(events.createdAt), desc(events.id)];
  }

  const primaryDir = descending ? desc : asc;
  const idTiebreak = descending ? desc(events.id) : asc(events.id);

  switch (sort) {
    case "title":
      return [primaryDir(events.title), idTiebreak];
    case "partner":
      return [primaryDir(events.partnerName), idTiebreak];
    case "date":
      return [primaryDir(events.dateTime), idTiebreak];
    case "created":
      return [primaryDir(events.createdAt), idTiebreak];
    case "capacity":
      return [primaryDir(events.remainingCapacity), primaryDir(events.totalCapacity), idTiebreak];
  }
}

export async function listEvents(db: Db, options: ListEventsOptions = {}): Promise<Event[]> {
  const limit = options.limit ?? 25;
  const offset = options.offset ?? 0;
  const descending = options.sort !== undefined ? Boolean(options.desc) : false;

  const excludeFeaturedExists = options.excludeFeatured
    ? notExists(
        db
          .select({ one: featuredEvents.eventId })
          .from(featuredEvents)
          .where(eq(featuredEvents.eventId, events.id)),
      )
    : undefined;

  const conditions = eventListFilterConditions({
    q: options.q,
    title: options.title,
    partner: options.partner,
    language: options.language,
    partnerId: options.partnerId,
    excludeFeaturedExists,
  });

  let query = db.select().from(events).$dynamic();
  if (conditions.length === 1) {
    query = query.where(conditions[0]);
  } else if (conditions.length > 1) {
    query = query.where(and(...conditions));
  }

  return query
    .orderBy(...eventListOrderBy(options.sort, descending))
    .limit(limit)
    .offset(offset);
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
  | "imageUpload"
  | "imageUrl"
  | "imagePrebuilt"
  | "stagedImageId"
  | "uploadedBy"
  | "skipUpload"
  | "imageCredit"
>;

async function applyKeptImageCredit(
  db: Db,
  imageId: string,
  credit: string | null | undefined,
): Promise<void> {
  if (credit === undefined) {
    return;
  }
  const { updateImageCredit } = await catalogImages();
  await updateImageCredit(db, imageId, credit);
}

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
      credit: input.imageCredit,
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
    await applyKeptImageCredit(db, stagedImageId, input.imageCredit);
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
      credit: input.imageCredit,
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
    await applyKeptImageCredit(db, stagedImageId, input.imageCredit);
    return stagedImageId;
  }

  validateImageSourceExclusive(input.imageUpload, input.imageUrl, {
    prebuilt: input.imagePrebuilt,
  });
  await applyKeptImageCredit(db, currentImageId, input.imageCredit);
  return currentImageId;
}

function throwFromNormalize(result: NormalizeOccurrencesResult): NormalizedEventOccurrences {
  if (result.ok) {
    return result.value;
  }
  switch (result.code) {
    case "EMPTY":
      throw new CatalogValidationError(
        "EMPTY_DATE_TIMES",
        "At least one dateTimes value is required",
      );
    case "DUPLICATE_INSTANT":
      throw new CatalogValidationError(
        "DUPLICATE_OCCURRENCE_INSTANTS",
        "Occurrence instants must be unique",
      );
    case "LENGTH_MISMATCH":
      throw new CatalogValidationError(
        "OCCURRENCE_LENGTH_MISMATCH",
        "dateTimes and occurrenceCreditPrices must have the same length",
      );
    case "CAPACITY_LENGTH_MISMATCH":
      throw new CatalogValidationError(
        "OCCURRENCE_CAPACITY_LENGTH_MISMATCH",
        "dateTimes and occurrenceCapacities must have the same length",
      );
    case "NEGATIVE_CREDIT":
      throw new CatalogValidationError(
        "NEGATIVE_CREDIT_PRICE",
        "Credit prices must be integers >= 0",
      );
    case "NEGATIVE_CAPACITY":
      throw new CatalogValidationError(
        "NEGATIVE_CAPACITY",
        "Occurrence capacities must be integers >= 0",
      );
  }
}

function requirePerOccurrenceCapacities(
  dateTimes: Date[],
  capacities: number[] | undefined,
): number[] {
  if (capacities === undefined || capacities.length !== dateTimes.length) {
    throw new CatalogValidationError(
      "OCCURRENCE_CAPACITY_LENGTH_MISMATCH",
      "dateTimes and occurrenceCapacities must have the same length",
    );
  }
  return capacities;
}

function sumOccurrenceCapacities(values: number[]): number {
  return values.reduce((acc, value) => acc + value, 0);
}

type ResolvedCapacityAllocation = {
  capacityMode: CapacityMode;
  occurrenceCapacities: number[];
  totalCapacity: number;
};

function resolveCapacityAllocation(
  occurrences: NormalizedEventOccurrences,
  input: {
    capacityMode?: CapacityMode | null;
    totalCapacity: number;
  },
  existing?: Pick<Event, "capacityMode" | "occurrenceCapacities">,
): ResolvedCapacityAllocation {
  const mode = input.capacityMode ?? existing?.capacityMode ?? "SHARED";

  if (mode === "PER_OCCURRENCE") {
    const capacities = requirePerOccurrenceCapacities(
      occurrences.dateTimes,
      occurrences.occurrenceCapacities ?? existing?.occurrenceCapacities,
    );
    const totalCapacity = sumOccurrenceCapacities(capacities);
    if (totalCapacity < 1) {
      throw new CatalogValidationError("REQUIRED_FIELD", "totalCapacity must be at least 1");
    }
    return {
      capacityMode: "PER_OCCURRENCE",
      occurrenceCapacities: capacities,
      totalCapacity,
    };
  }

  return {
    capacityMode: "SHARED",
    occurrenceCapacities: fillOccurrenceCapacities(occurrences.dateTimes, input.totalCapacity),
    totalCapacity: input.totalCapacity,
  };
}

function resolveCreateOccurrences(input: CreateEventInput): NormalizedEventOccurrences {
  const now = input.now ?? new Date();
  const mode = input.capacityMode ?? "SHARED";
  if (mode === "PER_OCCURRENCE") {
    if (input.occurrenceCapacities === undefined) {
      throw new CatalogValidationError(
        "OCCURRENCE_CAPACITY_LENGTH_MISMATCH",
        "dateTimes and occurrenceCapacities must have the same length",
      );
    }
    if (input.occurrenceCreditPrices !== undefined) {
      return throwFromNormalize(
        tryNormalizePairedDateTimesCreditsAndCapacities(
          input.dateTimes,
          input.occurrenceCreditPrices,
          input.occurrenceCapacities,
          now,
        ),
      );
    }
    return throwFromNormalize(
      tryNormalizePairedDateTimesAndCapacities(
        input.dateTimes,
        input.creditPrice,
        input.occurrenceCapacities,
        now,
      ),
    );
  }
  if (input.occurrenceCreditPrices !== undefined) {
    return throwFromNormalize(
      tryNormalizePairedDateTimesAndCredits(input.dateTimes, input.occurrenceCreditPrices, now),
    );
  }
  return throwFromNormalize(
    tryFillOccurrenceCreditsFromPrice(input.dateTimes, input.creditPrice, now),
  );
}

function resolveUpdateOccurrences(
  existing: Event,
  input: UpdateEventInput,
): NormalizedEventOccurrences {
  const now = input.now ?? new Date();
  const mode = input.capacityMode ?? existing.capacityMode;
  if (input.capacityMode === "PER_OCCURRENCE" && input.occurrenceCapacities === undefined) {
    throw new CatalogValidationError(
      "OCCURRENCE_CAPACITY_LENGTH_MISMATCH",
      "dateTimes and occurrenceCapacities must have the same length",
    );
  }
  const pairCapacities = mode === "PER_OCCURRENCE" && input.occurrenceCapacities !== undefined;
  const dateTimes = input.dateTimes ?? existing.dateTimes;

  if (pairCapacities) {
    const capacities = input.occurrenceCapacities ?? [];
    if (input.occurrenceCreditPrices !== undefined) {
      return throwFromNormalize(
        tryNormalizePairedDateTimesCreditsAndCapacities(
          dateTimes,
          input.occurrenceCreditPrices,
          capacities,
          now,
        ),
      );
    }
    if (input.dateTimes !== undefined) {
      return throwFromNormalize(
        tryNormalizePairedDateTimesAndCapacities(
          input.dateTimes,
          input.creditPrice ?? existing.creditPrice,
          capacities,
          now,
        ),
      );
    }
    const creditList =
      input.creditPrice !== undefined
        ? existing.dateTimes.map(() => input.creditPrice as number)
        : existing.occurrenceCreditPrices;
    return throwFromNormalize(
      tryNormalizePairedDateTimesCreditsAndCapacities(
        existing.dateTimes,
        creditList,
        capacities,
        now,
      ),
    );
  }

  if (input.occurrenceCreditPrices !== undefined) {
    return throwFromNormalize(
      tryNormalizePairedDateTimesAndCredits(
        input.dateTimes ?? existing.dateTimes,
        input.occurrenceCreditPrices,
        now,
      ),
    );
  }
  if (input.dateTimes !== undefined) {
    return throwFromNormalize(
      tryFillOccurrenceCreditsFromPrice(
        input.dateTimes,
        input.creditPrice ?? existing.creditPrice,
        now,
      ),
    );
  }
  if (input.creditPrice !== undefined) {
    return throwFromNormalize(
      tryFillOccurrenceCreditsFromPrice(existing.dateTimes, input.creditPrice, now),
    );
  }
  return {
    dateTimes: existing.dateTimes,
    occurrenceCreditPrices: existing.occurrenceCreditPrices,
    occurrenceCapacities: existing.occurrenceCapacities,
    dateTime: existing.dateTime,
    creditPrice: existing.creditPrice,
  };
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
  const street = requireNonEmpty(input.street, "street");
  const houseNumber = requireNonEmpty(input.houseNumber, "houseNumber");
  const addressLine2 = input.addressLine2?.trim() || null;
  const address = composeDisplayAddress({
    street,
    houseNumber,
    addressLine2,
    zipCode: location.zipCode,
    city: location.city,
  });

  const occurrences = resolveCreateOccurrences(input);
  const capacity = resolveCapacityAllocation(occurrences, {
    capacityMode: input.capacityMode ?? defaults.capacityMode,
    totalCapacity: defaults.totalCapacity,
  });
  const derived = deriveDateTimeFields(occurrences.dateTime, defaults.timingMode);
  const subtitles = resolveEventSubtitles(input.hasSubtitles ?? false, input.subtitleLanguages);
  const copy = resolveEventCopyFields(input);

  const inserted = await db
    .insert(events)
    .values({
      partnerId: input.partnerId,
      partnerName,
      title: copy.title,
      titleDe: copy.titleDe,
      titleEn: copy.titleEn,
      description: copy.description,
      descriptionDe: copy.descriptionDe,
      descriptionEn: copy.descriptionEn,
      address,
      street,
      houseNumber,
      addressLine2,
      country: location.country,
      city: location.city,
      zipCode: location.zipCode,
      imageId,
      category: assertEventCategory(input.category),
      eventType: assertEventType(input.eventType),
      tags: input.tags ?? [],
      dateTimes: occurrences.dateTimes,
      dateTime: occurrences.dateTime,
      timingMode: defaults.timingMode,
      startTimeMinutes: derived.startTimeMinutes,
      weekday: derived.weekday,
      occurrenceCreditPrices: occurrences.occurrenceCreditPrices,
      creditPrice: occurrences.creditPrice,
      capacityMode: capacity.capacityMode,
      occurrenceCapacities: capacity.occurrenceCapacities,
      totalCapacity: capacity.totalCapacity,
      remainingCapacity: capacity.totalCapacity,
      ticketType: defaults.ticketType,
      secretCode: input.secretCode?.trim() || null,
      promoCode: null,
      eventWebsiteUrl: input.eventWebsiteUrl?.trim() || null,
      languageIndependent: input.languageIndependent ?? false,
      languages: resolveEventLanguages(input.languageIndependent ?? false, input.languages),
      hasSubtitles: subtitles.hasSubtitles,
      subtitleLanguages: subtitles.subtitleLanguages,
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
  const capacityMode = input.capacityMode ?? source.capacityMode;
  const createInput: CreateEventInput = {
    partnerId: source.partnerId,
    title: source.title,
    description: source.description,
    titleDe: source.titleDe,
    titleEn: source.titleEn,
    descriptionDe: source.descriptionDe,
    descriptionEn: source.descriptionEn,
    street: source.street,
    houseNumber: source.houseNumber,
    addressLine2: source.addressLine2,
    zipCode: source.zipCode,
    country: source.country,
    city: source.city,
    category: source.category,
    eventType: source.eventType,
    tags: source.tags ?? [],
    dateTimes: input.dateTimes,
    occurrenceCreditPrices: input.occurrenceCreditPrices,
    now: input.now,
    timingMode: input.timingMode ?? source.timingMode,
    creditPrice: source.creditPrice,
    totalCapacity: input.totalCapacity ?? source.totalCapacity,
    capacityMode,
    occurrenceCapacities:
      input.occurrenceCapacities ??
      (capacityMode === "PER_OCCURRENCE" ? source.occurrenceCapacities : undefined),
    ticketType: source.ticketType,
    secretCode: source.secretCode,
    eventWebsiteUrl: source.eventWebsiteUrl,
    languageIndependent: source.languageIndependent,
    languages: source.languages,
    hasSubtitles: source.hasSubtitles,
    subtitleLanguages: source.subtitleLanguages,
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

  const nextOccurrences = resolveUpdateOccurrences(existing, input);
  const timingTouched =
    input.dateTimes !== undefined ||
    input.occurrenceCreditPrices !== undefined ||
    input.timingMode !== undefined;
  const nextTimingMode = input.timingMode ?? existing.timingMode;
  const derived = timingTouched
    ? deriveDateTimeFields(nextOccurrences.dateTime, nextTimingMode)
    : {
        startTimeMinutes: existing.startTimeMinutes,
        weekday: existing.weekday,
      };

  const capacity = resolveCapacityAllocation(
    nextOccurrences,
    {
      capacityMode: input.capacityMode,
      totalCapacity: input.totalCapacity ?? existing.totalCapacity,
    },
    existing,
  );
  const nextTotalCapacity = capacity.totalCapacity;
  const nextRemainingCapacity =
    nextTotalCapacity !== existing.totalCapacity
      ? recalculateRemainingCapacity(
          existing.totalCapacity,
          existing.remainingCapacity,
          nextTotalCapacity,
        )
      : existing.remainingCapacity;

  const locationTouched =
    input.zipCode !== undefined ||
    input.country !== undefined ||
    input.city !== undefined ||
    input.street !== undefined ||
    input.houseNumber !== undefined ||
    input.addressLine2 !== undefined;
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

  const nextStreet =
    input.street !== undefined ? requireNonEmpty(input.street, "street") : existing.street;
  const nextHouseNumber =
    input.houseNumber !== undefined
      ? requireNonEmpty(input.houseNumber, "houseNumber")
      : existing.houseNumber;
  const nextAddressLine2 =
    input.addressLine2 !== undefined ? input.addressLine2?.trim() || null : existing.addressLine2;
  const nextAddress = locationTouched
    ? composeDisplayAddress({
        street: nextStreet,
        houseNumber: nextHouseNumber,
        addressLine2: nextAddressLine2,
        zipCode: location.zipCode,
        city: location.city,
      })
    : existing.address;

  const nextHasSubtitles =
    input.hasSubtitles !== undefined ? input.hasSubtitles : existing.hasSubtitles;
  const nextSubtitleLanguages =
    input.subtitleLanguages !== undefined ? input.subtitleLanguages : existing.subtitleLanguages;
  const subtitles = resolveEventSubtitles(nextHasSubtitles, nextSubtitleLanguages);
  const copy = resolveUpdatedEventCopyFields(input, {
    title: existing.title,
    description: existing.description,
    titleDe: existing.titleDe,
    titleEn: existing.titleEn,
    descriptionDe: existing.descriptionDe,
    descriptionEn: existing.descriptionEn,
  });

  const updated = await db
    .update(events)
    .set({
      partnerId,
      partnerName: partner.name,
      title: copy.title,
      titleDe: copy.titleDe,
      titleEn: copy.titleEn,
      description: copy.description,
      descriptionDe: copy.descriptionDe,
      descriptionEn: copy.descriptionEn,
      address: nextAddress,
      street: nextStreet,
      houseNumber: nextHouseNumber,
      addressLine2: nextAddressLine2,
      country: location.country,
      city: location.city,
      zipCode: location.zipCode,
      imageId,
      category:
        input.category !== undefined ? assertEventCategory(input.category) : existing.category,
      eventType:
        input.eventType !== undefined ? assertEventType(input.eventType) : existing.eventType,
      tags: input.tags ?? existing.tags,
      dateTimes: nextOccurrences.dateTimes,
      dateTime: nextOccurrences.dateTime,
      timingMode: nextTimingMode,
      startTimeMinutes: derived.startTimeMinutes,
      weekday: derived.weekday,
      occurrenceCreditPrices: nextOccurrences.occurrenceCreditPrices,
      creditPrice: nextOccurrences.creditPrice,
      capacityMode: capacity.capacityMode,
      occurrenceCapacities: capacity.occurrenceCapacities,
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
      hasSubtitles: subtitles.hasSubtitles,
      subtitleLanguages: subtitles.subtitleLanguages,
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
  title?: string;
  partner?: string;
  language?: string;
};

export async function countEvents(db: Db, options: CountEventsOptions = {}): Promise<number> {
  const conditions = eventListFilterConditions({
    q: options.q,
    title: options.title,
    partner: options.partner,
    language: options.language,
  });

  if (conditions.length === 1) {
    const [result] = await db.select({ count: count() }).from(events).where(conditions[0]);
    return result?.count ?? 0;
  }
  if (conditions.length > 1) {
    const [result] = await db
      .select({ count: count() })
      .from(events)
      .where(and(...conditions));
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
