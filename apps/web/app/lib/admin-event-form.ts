import type { EventOccurrence, OpeningHoursWeek, TicketType, TimingMode } from "@unveiled/db";
import { CatalogValidationError, distinctOpenTimes, isClosedOnBerlinYmd } from "@unveiled/db";
import type { PrebuiltImageVariantsInput } from "@unveiled/images";

import { parsePrebuiltImageVariants } from "./admin-prebuilt-image";

export const MAX_SERIES_SLOTS = 52;
export const MANUAL_SLOT_ROWS = 5;
export const BUILDER_TIME_ROWS = 3;

export type VoucherPdfFormItem = {
  objectKey: string;
  originalFilename?: string | null;
  pageLabel?: string | null;
};

export type EventDateTimeRow = {
  date: string;
  time: string;
  /** Form string; parsed to an integer `>= 0` on submit. */
  credits: string;
};

export const DEFAULT_ROW_CREDITS = "1";
export const DEFAULT_RANGE_SLOT_TIME = "19:30";

export const MAX_EVENT_DATE_TIME_ROWS = 52;

export type RangeBuilderSlotRow = {
  time: string;
  credits: string;
};

export type RangeOccurrenceSlot = {
  time: string;
  creditPrice: number;
};

export type EventFormValues = {
  partnerId: string;
  title: string;
  description: string;
  street: string;
  houseNumber: string;
  addressLine2: string | null;
  zipCode: string;
  country?: string;
  city?: string;
  category: string;
  eventType: string;
  tags: string[];
  dateTimeRows: EventDateTimeRow[];
  rangeStart?: string;
  rangeEnd?: string;
  rangeSlots?: RangeBuilderSlotRow[];
  timingMode: TimingMode;
  creditPrice: number;
  totalCapacity: number;
  ticketType: TicketType;
  secretCode: string | null;
  eventWebsiteUrl: string | null;
  promoCodes: string[];
  voucherPdfs: VoucherPdfFormItem[];
  replaceUnusedInventory: boolean;
  barrierFree: boolean | null;
  languageIndependent: boolean;
  languages: string[] | null;
  hasSubtitles: boolean;
  subtitleLanguage: string | null;
  lat: string | null;
  lng: string | null;
  imageUpload: Buffer | null;
  imageUrl: string | null;
  imagePrebuilt: PrebuiltImageVariantsInput | null;
  /** Persisted primary image id posted without variant Files (error-form retry). */
  stagedImageId: string | null;
};

export type SeriesSlotMode = "manual" | "builder";

function getTimeZoneOffsetMs(timeZone: string, date: Date): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const filled: Record<string, string> = {};

  for (const { type, value } of parts) {
    if (type !== "literal") {
      filled[type] = value;
    }
  }

  const asUtc = Date.UTC(
    Number(filled.year),
    Number(filled.month) - 1,
    Number(filled.day),
    Number(filled.hour),
    Number(filled.minute),
    Number(filled.second),
  );

  return asUtc - date.getTime();
}

export function parseBerlinDateTime(
  dateStr: string,
  timeStr: string | null,
  timingMode: TimingMode,
): Date {
  const match = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    throw new Error("Invalid date format");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  let hour = 0;
  let minute = 0;

  if (timingMode !== "ALL_DAY") {
    const timeMatch = timeStr?.match(/^(\d{2}):(\d{2})$/);
    if (!timeMatch) {
      throw new Error("Invalid time format");
    }

    hour = Number(timeMatch[1]);
    minute = Number(timeMatch[2]);
  }

  let utcMs = Date.UTC(year, month - 1, day, hour, minute, 0);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const offsetMs = getTimeZoneOffsetMs("Europe/Berlin", new Date(utcMs));
    utcMs = Date.UTC(year, month - 1, day, hour, minute, 0) - offsetMs;
  }

  return new Date(utcMs);
}

export function formatEventDateTime(date: Date, locale: "de" | "en"): string {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    timeZone: "Europe/Berlin",
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** Primary/next datetime plus optional `+N` when the event has more occurrences. */
export function formatEventDateTimeWithCount(
  date: Date,
  locale: "de" | "en",
  dateTimesCount = 1,
): string {
  const primary = formatEventDateTime(date, locale);
  if (dateTimesCount <= 1) {
    return primary;
  }
  return `${primary} +${dateTimesCount - 1}`;
}

export function formatEventDateInput(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return `${pick("year")}-${pick("month")}-${pick("day")}`;
}

export function formatEventTimeInput(date: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value ?? "00";

  return `${pick("hour")}:${pick("minute")}`;
}

function parseCommaSeparated(value: string | undefined): string[] {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function parseStringArray(value: string | string[] | undefined): string[] {
  if (value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0,
    );
  }

  return parseCommaSeparated(value);
}

function parseInteger(value: string | undefined, fallback: number): number {
  if (!value?.trim()) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

/** Strict integer `>= 0`; blank / NaN / non-integer / negative → null (submit must fail). */
export function parseOccurrenceCredit(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed || !/^-?\d+$/.test(trimmed)) {
    return null;
  }

  const parsed = Number.parseInt(trimmed, 10);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function derivedCreditPrice(rows: EventDateTimeRow[]): number {
  for (const row of rows) {
    if (!row.date.trim()) {
      continue;
    }
    return parseOccurrenceCredit(row.credits) ?? 1;
  }
  return 1;
}

function parseBodyStringArrayField(
  body: ParsedBody,
  key: string,
  asString: (value: string | File | (string | File)[] | undefined) => string | undefined,
): string[] {
  const value = body[key];
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0,
    );
  }

  return parseStringArray(asString(value));
}

function parseTimingMode(value: string | undefined): TimingMode {
  return value === "ALL_DAY" ? "ALL_DAY" : "TIME_SLOT";
}

function parseTicketType(value: string | undefined): TicketType {
  if (value === "VOUCHER_PROMO" || value === "VOUCHER" || value === "VOUCHER_PDF") {
    // Legacy form posts "VOUCHER"; map to VOUCHER_PROMO.
    return value === "VOUCHER_PDF" ? "VOUCHER_PDF" : "VOUCHER_PROMO";
  }

  return "SECRET_CODE";
}

export function parsePromoCodesJson(raw: string | undefined): string[] {
  if (!raw?.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function parseVoucherPdfsJson(raw: string | undefined): VoucherPdfFormItem[] {
  if (!raw?.trim()) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    const items: VoucherPdfFormItem[] = [];
    for (const item of parsed) {
      if (!item || typeof item !== "object") {
        continue;
      }
      const record = item as Record<string, unknown>;
      const objectKey = typeof record.objectKey === "string" ? record.objectKey.trim() : "";
      if (!objectKey) {
        continue;
      }
      items.push({
        objectKey,
        originalFilename:
          typeof record.originalFilename === "string" ? record.originalFilename : null,
        pageLabel: typeof record.pageLabel === "string" ? record.pageLabel : null,
      });
    }
    return items;
  } catch {
    return [];
  }
}

export function parseIsoSlotDates(values: string[]): Date[] {
  const slots: Date[] = [];

  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) {
      continue;
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(`Invalid slot ISO date: ${trimmed}`);
    }

    slots.push(parsed);
  }

  return slots;
}

function enumerateDatesInclusive(start: string, end: string): string[] {
  const startMatch = start.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  const endMatch = end.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!startMatch || !endMatch) {
    throw new Error("Invalid builder date range");
  }

  const dates: string[] = [];
  const cursor = new Date(`${start}T00:00:00.000Z`);
  const endDate = new Date(`${end}T00:00:00.000Z`);

  while (cursor.getTime() <= endDate.getTime()) {
    dates.push(cursor.toISOString().slice(0, 10));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
}

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

function throwTooManyOccurrences(): never {
  throw new CatalogValidationError(
    "TOO_MANY_OCCURRENCES",
    `A range can create at most ${MAX_EVENT_DATE_TIME_ROWS} datetimes`,
  );
}

export function defaultRangeSlotsFromHours(
  hasOpeningHours: boolean,
  openingHours: OpeningHoursWeek | null | undefined,
): RangeBuilderSlotRow[] {
  if (hasOpeningHours && openingHours) {
    const times = distinctOpenTimes(openingHours);
    if (times.length > 0) {
      return times.map((time) => ({ time, credits: DEFAULT_ROW_CREDITS }));
    }
  }

  return [{ time: DEFAULT_RANGE_SLOT_TIME, credits: DEFAULT_ROW_CREDITS }];
}

export function hoursForRangeExpand(
  hasOpeningHours: boolean,
  openingHours: OpeningHoursWeek | null | undefined,
): OpeningHoursWeek | null {
  if (!hasOpeningHours || openingHours == null) {
    return null;
  }
  return openingHours;
}

export function expandOccurrencesFromRange(options: {
  startDate: string;
  endDate: string;
  slots: RangeOccurrenceSlot[];
  timingMode: TimingMode;
  openingHours?: OpeningHoursWeek | null;
}): EventOccurrence[] {
  const startDate = options.startDate.trim();
  const endDate = options.endDate.trim();
  const slots = options.slots.filter((slot) => slot.time.trim().length > 0);

  if (!YMD_RE.test(startDate) || !YMD_RE.test(endDate) || slots.length === 0) {
    return [];
  }

  if (startDate > endDate) {
    return [];
  }

  const dates = enumerateDatesInclusive(startDate, endDate);
  const hours = options.openingHours ?? null;
  const openDates = hours ? dates.filter((ymd) => !isClosedOnBerlinYmd(hours, ymd)) : dates;

  const occurrences: EventOccurrence[] = [];

  if (options.timingMode === "ALL_DAY") {
    const firstSlot = slots[0];
    if (!firstSlot) {
      return [];
    }
    for (const ymd of openDates) {
      occurrences.push({
        startsAt: parseBerlinDateTime(ymd, null, "ALL_DAY"),
        creditPrice: firstSlot.creditPrice,
      });
    }
  } else {
    for (const ymd of openDates) {
      for (const slot of slots) {
        occurrences.push({
          startsAt: parseBerlinDateTime(ymd, slot.time.trim(), "TIME_SLOT"),
          creditPrice: slot.creditPrice,
        });
      }
    }
  }

  if (occurrences.length > MAX_EVENT_DATE_TIME_ROWS) {
    throwTooManyOccurrences();
  }

  return occurrences;
}

function getBerlinWeekdayIndex(dateStr: string): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Europe/Berlin",
    weekday: "short",
  }).format(new Date(`${dateStr}T12:00:00.000Z`));

  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const index = map[weekday];
  if (index === undefined) {
    throw new Error(`Unexpected weekday: ${weekday}`);
  }

  return index;
}

export function expandSeriesSlotsFromBuilder(options: {
  startDate: string;
  endDate: string;
  weekdays: number[];
  times: string[];
  excludedDates: string[];
  timingMode: TimingMode;
}): Date[] {
  if (options.weekdays.length === 0 || options.times.length === 0) {
    return [];
  }

  const excluded = new Set(options.excludedDates);
  const slots: Date[] = [];

  for (const dateStr of enumerateDatesInclusive(options.startDate, options.endDate)) {
    if (excluded.has(dateStr)) {
      continue;
    }

    if (!options.weekdays.includes(getBerlinWeekdayIndex(dateStr))) {
      continue;
    }

    for (const time of options.times) {
      slots.push(parseBerlinDateTime(dateStr, time, options.timingMode));
    }
  }

  if (slots.length > MAX_SERIES_SLOTS) {
    throw new Error(`Series exceeds maximum of ${MAX_SERIES_SLOTS} slots`);
  }

  return slots;
}

export function parseBuilderTimes(
  body: ParsedBody,
  asString: (value: string | File | (string | File)[] | undefined) => string | undefined,
): string[] {
  const times: string[] = [];

  for (let index = 0; index < BUILDER_TIME_ROWS; index += 1) {
    const value = asString(body[`builder_time_${index}`])?.trim();
    if (value) {
      times.push(value);
    }
  }

  if (times.length > 0) {
    return times;
  }

  return parseCommaSeparated(asString(body.builder_times) ?? undefined);
}

export function parseRangeBuilder(
  body: ParsedBody,
  asString: (value: string | File | (string | File)[] | undefined) => string | undefined,
): { rangeStart: string; rangeEnd: string; rangeSlots: RangeBuilderSlotRow[] } {
  const rangeStart = asString(body.range_start)?.trim() ?? "";
  const rangeEnd = asString(body.range_end)?.trim() ?? "";
  const countRaw = asString(body.range_slot_count)?.trim();
  const count = countRaw ? Number.parseInt(countRaw, 10) : 0;
  const rangeSlots: RangeBuilderSlotRow[] = [];

  if (Number.isFinite(count) && count > 0) {
    for (let index = 0; index < count; index += 1) {
      const time = asString(body[`range_slot_time_${index}`])?.trim() ?? "";
      const credits = asString(body[`range_slot_credit_${index}`])?.trim() || DEFAULT_ROW_CREDITS;
      rangeSlots.push({ time, credits });
    }
  }

  return { rangeStart, rangeEnd, rangeSlots };
}

export function parseManualSeriesSlots(
  body: Record<string, string | File | (string | File)[]>,
  timingMode: TimingMode,
  asString: (value: string | File | (string | File)[] | undefined) => string | undefined,
): Date[] {
  const slots: Date[] = [];

  for (let index = 0; index < MANUAL_SLOT_ROWS; index += 1) {
    const dateStr = asString(body[`slot_date_${index}`])?.trim();
    const timeStr = asString(body[`slot_time_${index}`])?.trim();

    if (!dateStr) {
      continue;
    }

    slots.push(parseBerlinDateTime(dateStr, timeStr ?? null, timingMode));
  }

  return slots;
}

export type ParsedBody = Record<string, string | File | (string | File)[]>;

function emptyDateTimeRow(credits = DEFAULT_ROW_CREDITS): EventDateTimeRow {
  return { date: "", time: "", credits };
}

function creditsForParsedRow(
  body: ParsedBody,
  asString: (value: string | File | (string | File)[] | undefined) => string | undefined,
  index: number,
  legacyCredit: string | undefined,
): string {
  const raw = asString(body[`event_credit_${index}`]);
  if (raw !== undefined) {
    return raw.trim();
  }
  if (legacyCredit !== undefined) {
    return legacyCredit;
  }
  return DEFAULT_ROW_CREDITS;
}

export function parseEventDateTimeRows(
  body: ParsedBody,
  asString: (value: string | File | (string | File)[] | undefined) => string | undefined,
): EventDateTimeRow[] {
  const countRaw = asString(body.datetime_count)?.trim();
  const parsedCount = countRaw ? Number.parseInt(countRaw, 10) : Number.NaN;
  const hasIndexed =
    Number.isFinite(parsedCount) ||
    asString(body.event_date_0) !== undefined ||
    body.event_date_0 !== undefined;
  const hasIndexedCredits =
    asString(body.event_credit_0) !== undefined || body.event_credit_0 !== undefined;
  const legacyCredit = hasIndexedCredits ? undefined : asString(body.credit_price)?.trim();

  if (hasIndexed) {
    let count = Number.isFinite(parsedCount)
      ? Math.min(Math.max(parsedCount, 0), MAX_EVENT_DATE_TIME_ROWS)
      : 0;

    if (!Number.isFinite(parsedCount)) {
      for (let index = 0; index < MAX_EVENT_DATE_TIME_ROWS; index += 1) {
        if (
          asString(body[`event_date_${index}`]) === undefined &&
          body[`event_date_${index}`] === undefined
        ) {
          break;
        }
        count = index + 1;
      }
    }

    const rows: EventDateTimeRow[] = [];
    for (let index = 0; index < count; index += 1) {
      rows.push({
        date: asString(body[`event_date_${index}`])?.trim() ?? "",
        time: asString(body[`event_time_${index}`])?.trim() ?? "",
        credits: creditsForParsedRow(body, asString, index, legacyCredit),
      });
    }
    return rows.length > 0 ? rows : [emptyDateTimeRow(legacyCredit ?? DEFAULT_ROW_CREDITS)];
  }

  // Legacy single-field posts (pre multi-datetime form).
  return [
    {
      date: asString(body.event_date)?.trim() ?? "",
      time: asString(body.event_time)?.trim() ?? "",
      credits: creditsForParsedRow(body, asString, 0, legacyCredit),
    },
  ];
}

export function dateTimesToFormRows(
  dateTimes: Date[],
  occurrenceCreditPrices?: number[],
): EventDateTimeRow[] {
  if (dateTimes.length === 0) {
    return [emptyDateTimeRow()];
  }

  return dateTimes.map((dateTime, index) => {
    const price = occurrenceCreditPrices?.[index];
    return {
      date: formatEventDateInput(dateTime),
      time: formatEventTimeInput(dateTime),
      credits: price !== undefined ? String(price) : DEFAULT_ROW_CREDITS,
    };
  });
}

export function occurrencesToFormRows(occurrences: EventOccurrence[]): EventDateTimeRow[] {
  return dateTimesToFormRows(
    occurrences.map((occurrence) => occurrence.startsAt),
    occurrences.map((occurrence) => occurrence.creditPrice),
  );
}

/** Prefill create/edit/clone datetime rows from the full occurrence lists. */
export function eventDateTimesToFormRows(event: {
  dateTimes: Date[];
  dateTime: Date;
  occurrenceCreditPrices?: number[];
}): EventDateTimeRow[] {
  return dateTimesToFormRows(event.dateTimes, event.occurrenceCreditPrices);
}

export async function parseEventFormBody(
  body: ParsedBody,
  asString: (value: string | File | (string | File)[] | undefined) => string | undefined,
  asFile: (value: string | File | (string | File)[] | undefined) => File | Blob | undefined,
): Promise<EventFormValues> {
  const timingMode = parseTimingMode(asString(body.timing_mode));
  const imagePrebuilt = await parsePrebuiltImageVariants(body, asString, asFile);
  // Complete prebuilt wins; bare `imageId` (no variant Files) is a staged retry handle.
  const stagedImageId = imagePrebuilt ? null : asString(body.imageId)?.trim() || null;

  let imageUpload: Buffer | null = null;
  if (!imagePrebuilt) {
    const imageFile = asFile(body.image);
    if (imageFile && imageFile.size > 0) {
      imageUpload = Buffer.from(await imageFile.arrayBuffer());
    }
  }

  const languageIndependent = asString(body.language_independent) === "on";
  const languages = languageIndependent
    ? []
    : parseBodyStringArrayField(body, "languages", asString);
  const hasSubtitles = asString(body.has_subtitles) === "on";
  const subtitleLanguageRaw = asString(body.subtitle_language)?.trim() || null;
  const subtitleLanguage = hasSubtitles ? subtitleLanguageRaw : null;
  const imageUrl = asString(body.image_url)?.trim() || null;

  const dateTimeRows = parseEventDateTimeRows(body, asString);
  const range = parseRangeBuilder(body, asString);

  return {
    partnerId: asString(body.partner_id)?.trim() ?? "",
    title: asString(body.title)?.trim() ?? "",
    description: asString(body.description)?.trim() ?? "",
    street: asString(body.street)?.trim() ?? "",
    houseNumber: asString(body.house_number)?.trim() ?? "",
    addressLine2: asString(body.address_line2)?.trim() || null,
    zipCode: asString(body.zip_code)?.trim() ?? "",
    country: asString(body.country)?.trim() || undefined,
    city: asString(body.city)?.trim() || undefined,
    category: asString(body.category)?.trim() ?? "",
    eventType: asString(body.event_type)?.trim() ?? "",
    tags: parseCommaSeparated(asString(body.tags)),
    dateTimeRows,
    rangeStart: range.rangeStart,
    rangeEnd: range.rangeEnd,
    rangeSlots: range.rangeSlots,
    timingMode,
    creditPrice: derivedCreditPrice(dateTimeRows),
    totalCapacity: parseInteger(asString(body.total_capacity), 10),
    ticketType: parseTicketType(asString(body.ticket_type)),
    secretCode: asString(body.secret_code)?.trim() || null,
    eventWebsiteUrl: asString(body.event_website_url)?.trim() || null,
    promoCodes: parsePromoCodesJson(asString(body.promo_codes_json)),
    voucherPdfs: parseVoucherPdfsJson(asString(body.voucher_pdfs_json)),
    replaceUnusedInventory: asString(body.replace_unused_inventory) === "on",
    barrierFree: asString(body.barrier_free) === "on" ? true : null,
    languageIndependent,
    languages: languages.length > 0 ? languages : null,
    hasSubtitles,
    subtitleLanguage,
    lat: asString(body.lat)?.trim() || null,
    lng: asString(body.lng)?.trim() || null,
    imageUpload,
    imageUrl,
    imagePrebuilt,
    stagedImageId,
  };
}

/** @deprecated Prefer eventFormValuesToDateTimes — kept for any one-off single-date callers. */
export function eventFormValuesToDateTime(values: EventFormValues): Date {
  const [first] = eventFormValuesToDateTimes(values);
  if (!first) {
    throw new CatalogValidationError("EMPTY_DATE_TIMES", "At least one datetime is required");
  }
  return first;
}

export function eventFormValuesToOccurrences(values: EventFormValues): EventOccurrence[] {
  const occurrences: EventOccurrence[] = [];

  for (const row of values.dateTimeRows) {
    if (!row.date.trim()) {
      continue;
    }

    const creditPrice = parseOccurrenceCredit(row.credits);
    if (creditPrice === null) {
      throw new CatalogValidationError(
        "NEGATIVE_CREDIT_PRICE",
        "Each datetime row must have a whole-number credit price of 0 or more",
      );
    }

    const timeStr = row.time.trim() || null;
    occurrences.push({
      startsAt: parseBerlinDateTime(row.date, timeStr, values.timingMode),
      creditPrice,
    });
  }

  if (occurrences.length === 0) {
    throw new CatalogValidationError("EMPTY_DATE_TIMES", "At least one datetime is required");
  }

  if (occurrences.length > MAX_EVENT_DATE_TIME_ROWS) {
    throwTooManyOccurrences();
  }

  return occurrences;
}

export function eventFormValuesToOccurrenceLists(values: EventFormValues): {
  dateTimes: Date[];
  occurrenceCreditPrices: number[];
} {
  const occurrences = eventFormValuesToOccurrences(values);
  return {
    dateTimes: occurrences.map((occurrence) => occurrence.startsAt),
    occurrenceCreditPrices: occurrences.map((occurrence) => occurrence.creditPrice),
  };
}

export function eventFormValuesToDateTimes(values: EventFormValues): Date[] {
  return eventFormValuesToOccurrenceLists(values).dateTimes;
}

function parseBodyStringArray(
  body: ParsedBody,
  key: string,
  asString: (value: string | File | (string | File)[] | undefined) => string | undefined,
): string[] {
  const value = body[key];
  if (Array.isArray(value)) {
    return value.filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0,
    );
  }

  return parseCommaSeparated(asString(value));
}

export function parseSeriesSlots(
  body: ParsedBody,
  asString: (value: string | File | (string | File)[] | undefined) => string | undefined,
): Date[] {
  const slotMode = asString(body.slot_mode) === "builder" ? "builder" : "manual";
  const timingMode = parseTimingMode(asString(body.timing_mode));
  const isoValues = body.slot_iso;

  if (isoValues !== undefined) {
    const raw = Array.isArray(isoValues)
      ? isoValues.filter((item): item is string => typeof item === "string")
      : typeof isoValues === "string"
        ? [isoValues]
        : [];

    return parseIsoSlotDates(raw);
  }

  if (slotMode === "builder") {
    const weekdays = parseBodyStringArray(body, "builder_weekdays", asString).map((value) =>
      Number.parseInt(value, 10),
    );
    const times = parseBuilderTimes(body, asString);

    return expandSeriesSlotsFromBuilder({
      startDate: asString(body.builder_start)?.trim() ?? "",
      endDate: asString(body.builder_end)?.trim() ?? "",
      weekdays: weekdays.filter((value) => Number.isFinite(value)),
      times,
      excludedDates: parseCommaSeparated(asString(body.builder_excluded) ?? undefined),
      timingMode,
    });
  }

  return parseManualSeriesSlots(body, timingMode, asString);
}
