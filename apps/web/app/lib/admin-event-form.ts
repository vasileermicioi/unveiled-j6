import type { SecretCodeMode, TicketType, TimingMode } from "@unveiled/db";

export const MAX_SERIES_SLOTS = 52;
export const MANUAL_SLOT_ROWS = 5;

export type EventFormValues = {
  partnerId: string;
  title: string;
  description: string;
  address: string;
  neighborhood: string;
  category: string;
  eventType: string;
  tags: string[];
  eventDate: string;
  eventTime: string;
  timingMode: TimingMode;
  creditPrice: number;
  totalCapacity: number;
  ticketType: TicketType;
  secretCodeMode: SecretCodeMode;
  secretCode: string | null;
  promoCode: string | null;
  eventWebsiteUrl: string | null;
  barrierFree: boolean | null;
  languages: string[] | null;
  targetAgeGroups: string[] | null;
  lat: string | null;
  lng: string | null;
  imageUpload: Buffer | null;
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

function parseTimingMode(value: string | undefined): TimingMode {
  return value === "ALL_DAY" ? "ALL_DAY" : "TIME_SLOT";
}

function parseTicketType(value: string | undefined): TicketType {
  return value === "VOUCHER" ? "VOUCHER" : "SECRET_CODE";
}

function parseSecretCodeMode(value: string | undefined): SecretCodeMode {
  if (value === "SHARED_GENERATED" || value === "UNIQUE_PER_BOOKING") {
    return value;
  }

  return "MANUAL";
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

export async function parseEventFormBody(
  body: ParsedBody,
  asString: (value: string | File | (string | File)[] | undefined) => string | undefined,
  asFile: (value: string | File | (string | File)[] | undefined) => File | Blob | undefined,
): Promise<EventFormValues> {
  const timingMode = parseTimingMode(asString(body.timing_mode));
  const imageFile = asFile(body.image);
  let imageUpload: Buffer | null = null;

  if (imageFile && imageFile.size > 0) {
    imageUpload = Buffer.from(await imageFile.arrayBuffer());
  }

  const languages = parseStringArray(asString(body.languages) ?? undefined);
  const targetAgeGroups = parseStringArray(asString(body.target_age_groups) ?? undefined);

  return {
    partnerId: asString(body.partner_id)?.trim() ?? "",
    title: asString(body.title)?.trim() ?? "",
    description: asString(body.description)?.trim() ?? "",
    address: asString(body.address)?.trim() ?? "",
    neighborhood: asString(body.neighborhood)?.trim() ?? "",
    category: asString(body.category)?.trim() ?? "",
    eventType: asString(body.event_type)?.trim() ?? "",
    tags: parseCommaSeparated(asString(body.tags)),
    eventDate: asString(body.event_date)?.trim() ?? "",
    eventTime: asString(body.event_time)?.trim() ?? "",
    timingMode,
    creditPrice: parseInteger(asString(body.credit_price), 1),
    totalCapacity: parseInteger(asString(body.total_capacity), 10),
    ticketType: parseTicketType(asString(body.ticket_type)),
    secretCodeMode: parseSecretCodeMode(asString(body.secret_code_mode)),
    secretCode: asString(body.secret_code)?.trim() || null,
    promoCode: asString(body.promo_code)?.trim() || null,
    eventWebsiteUrl: asString(body.event_website_url)?.trim() || null,
    barrierFree: asString(body.barrier_free) === "on" ? true : null,
    languages: languages.length > 0 ? languages : null,
    targetAgeGroups: targetAgeGroups.length > 0 ? targetAgeGroups : null,
    lat: asString(body.lat)?.trim() || null,
    lng: asString(body.lng)?.trim() || null,
    imageUpload,
  };
}

export function eventFormValuesToDateTime(values: EventFormValues): Date {
  return parseBerlinDateTime(values.eventDate, values.eventTime, values.timingMode);
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
    const times = parseCommaSeparated(asString(body.builder_times) ?? undefined);

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
