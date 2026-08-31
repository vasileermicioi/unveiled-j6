import type { TimingMode } from "../schema/events";

const BERLIN_TZ = "Europe/Berlin";

const WEEKDAY_MAP: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

const YMD_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

export type DerivedDateTimeFields = {
  startTimeMinutes: number;
  weekday: number;
};

export type BerlinDayRange = {
  /** Inclusive UTC instant for Europe/Berlin midnight of the start day. */
  start: Date;
  /** Exclusive UTC instant for Europe/Berlin midnight of the day after the end day. */
  end: Date;
};

export function deriveDateTimeFields(
  dateTime: Date,
  timingMode: TimingMode,
): DerivedDateTimeFields {
  if (timingMode === "ALL_DAY") {
    const weekday = getBerlinWeekday(dateTime);
    return { startTimeMinutes: 0, weekday };
  }

  const parts = getBerlinTimeParts(dateTime);
  return {
    startTimeMinutes: parts.hour * 60 + parts.minute,
    weekday: parts.weekday,
  };
}

/**
 * Sort ascending and dedupe by epoch ms. Does not reject empty — callers validate.
 */
export function sortUniqueDateTimes(dateTimes: Date[]): Date[] {
  const byMs = new Map<number, Date>();
  for (const value of dateTimes) {
    const ms = value.getTime();
    if (!Number.isFinite(ms)) {
      continue;
    }
    if (!byMs.has(ms)) {
      byMs.set(ms, value);
    }
  }
  return [...byMs.entries()].sort(([a], [b]) => a - b).map(([, date]) => date);
}

/**
 * Instant at which an occurrence is no longer bookable / listed as upcoming.
 * Time-slot events expire at `startsAt`; all-day events stay current until the
 * next Europe/Berlin midnight (`startsAt` is stored as that day's 00:00).
 */
export function occurrenceHorizon(now: Date, timingMode: TimingMode = "TIME_SLOT"): Date {
  if (timingMode === "ALL_DAY") {
    return berlinTodayRange(now).start;
  }
  return now;
}

export function isOccurrenceUpcoming(
  startsAt: Date,
  now: Date,
  timingMode: TimingMode = "TIME_SLOT",
): boolean {
  return startsAt.getTime() >= occurrenceHorizon(now, timingMode).getTime();
}

/**
 * Next upcoming instant (`>= horizon`), or the earliest instant when all are past.
 * Assumes `dateTimes` is non-empty and preferably pre-normalized.
 * All-day horizon is Berlin midnight today so today's 00:00 slot stays current.
 */
export function primaryDateTimeFromList(
  dateTimes: Date[],
  now: Date = new Date(),
  timingMode: TimingMode = "TIME_SLOT",
): Date {
  if (dateTimes.length === 0) {
    throw new Error("primaryDateTimeFromList requires a non-empty list");
  }

  const horizonMs = occurrenceHorizon(now, timingMode).getTime();
  let next: Date | undefined;
  const first = dateTimes[0];
  if (!first) {
    throw new Error("primaryDateTimeFromList requires a non-empty list");
  }
  let earliest = first;

  for (const value of dateTimes) {
    if (value.getTime() < earliest.getTime()) {
      earliest = value;
    }
    if (value.getTime() >= horizonMs && (next === undefined || value.getTime() < next.getTime())) {
      next = value;
    }
  }

  return next ?? earliest;
}

export type NormalizedEventDateTimes = {
  dateTimes: Date[];
  dateTime: Date;
};

/**
 * Sort+unique then derive primary. Returns null when the list is empty after normalize.
 */
export function tryNormalizeEventDateTimes(
  dateTimes: Date[],
  now: Date = new Date(),
): NormalizedEventDateTimes | null {
  const normalized = sortUniqueDateTimes(dateTimes);
  if (normalized.length === 0) {
    return null;
  }
  return {
    dateTimes: normalized,
    dateTime: primaryDateTimeFromList(normalized, now),
  };
}

export type EventOccurrence = {
  startsAt: Date;
  creditPrice: number;
  capacity?: number;
};

export type NormalizedEventOccurrences = {
  dateTimes: Date[];
  occurrenceCreditPrices: number[];
  occurrenceCapacities?: number[];
  dateTime: Date;
  creditPrice: number;
};

export type NormalizeOccurrencesFailureCode =
  | "EMPTY"
  | "DUPLICATE_INSTANT"
  | "LENGTH_MISMATCH"
  | "CAPACITY_LENGTH_MISMATCH"
  | "NEGATIVE_CREDIT"
  | "NEGATIVE_CAPACITY";

export type NormalizeOccurrencesResult =
  | { ok: true; value: NormalizedEventOccurrences }
  | { ok: false; code: NormalizeOccurrencesFailureCode };

function isValidCreditPrice(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

function isValidCapacity(value: number): boolean {
  return Number.isInteger(value) && value >= 0;
}

function zipOccurrences(dateTimes: Date[], occurrenceCreditPrices: number[]): EventOccurrence[] {
  const length = Math.min(dateTimes.length, occurrenceCreditPrices.length);
  const zipped: EventOccurrence[] = [];
  for (let index = 0; index < length; index += 1) {
    const startsAt = dateTimes[index];
    const creditPrice = occurrenceCreditPrices[index];
    if (!startsAt || creditPrice === undefined || !Number.isFinite(startsAt.getTime())) {
      continue;
    }
    zipped.push({ startsAt, creditPrice });
  }
  return zipped;
}

function primaryCreditFromLists(
  dateTimes: Date[],
  occurrenceCreditPrices: number[],
  dateTime: Date,
): number {
  const credit = creditPriceForOccurrence(dateTimes, occurrenceCreditPrices, dateTime);
  const fallback = occurrenceCreditPrices[0];
  if (credit === null && fallback === undefined) {
    throw new Error("primaryCreditFromLists requires a non-empty credit list");
  }
  return credit ?? fallback ?? 0;
}

/**
 * Credit for an occurrence instant. Exact epoch-ms match after Date normalize.
 * Returns null when the instant is missing or the parallel arrays are misaligned.
 */
export function creditPriceForOccurrence(
  dateTimes: Date[],
  occurrenceCreditPrices: number[],
  dateTime: Date,
): number | null {
  const targetMs = dateTime.getTime();
  if (!Number.isFinite(targetMs)) {
    return null;
  }
  const index = dateTimes.findIndex((value) => value.getTime() === targetMs);
  if (index < 0) {
    return null;
  }
  const credit = occurrenceCreditPrices[index];
  return credit === undefined ? null : credit;
}

/**
 * Occurrences still upcoming for `timingMode`, sorted ascending by instant.
 * All-day slots remain listed through the end of their Berlin calendar day.
 * Zips by index; extra elements on either array are ignored.
 */
export function futureOccurrences(
  dateTimes: Date[],
  occurrenceCreditPrices: number[],
  now: Date = new Date(),
  timingMode: TimingMode = "TIME_SLOT",
): EventOccurrence[] {
  return zipOccurrences(dateTimes, occurrenceCreditPrices)
    .filter((occurrence) => isOccurrenceUpcoming(occurrence.startsAt, now, timingMode))
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}

/**
 * Pair occurrences, sort by instant, reject empty / duplicate instants / invalid credits.
 * When `capacity` is present on any row it MUST be present and valid on every row.
 * Does **not** unique-merge — callers that need silent dedupe must use the legacy fill helper.
 */
export function tryNormalizeEventOccurrences(
  occurrences: EventOccurrence[],
  now: Date = new Date(),
): NormalizeOccurrencesResult {
  if (occurrences.length === 0) {
    return { ok: false, code: "EMPTY" };
  }

  const seen = new Set<number>();
  const paired: EventOccurrence[] = [];
  let capacityPresence: "unknown" | "all" | "none" = "unknown";

  for (const occurrence of occurrences) {
    const ms = occurrence.startsAt.getTime();
    if (!Number.isFinite(ms)) {
      continue;
    }
    if (!isValidCreditPrice(occurrence.creditPrice)) {
      return { ok: false, code: "NEGATIVE_CREDIT" };
    }
    const hasCapacity = occurrence.capacity !== undefined;
    if (capacityPresence === "unknown") {
      capacityPresence = hasCapacity ? "all" : "none";
    } else if ((capacityPresence === "all") !== hasCapacity) {
      return { ok: false, code: "CAPACITY_LENGTH_MISMATCH" };
    }
    if (hasCapacity && occurrence.capacity !== undefined && !isValidCapacity(occurrence.capacity)) {
      return { ok: false, code: "NEGATIVE_CAPACITY" };
    }
    if (seen.has(ms)) {
      return { ok: false, code: "DUPLICATE_INSTANT" };
    }
    seen.add(ms);
    paired.push(occurrence);
  }

  if (paired.length === 0) {
    return { ok: false, code: "EMPTY" };
  }

  paired.sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
  const dateTimes = paired.map((occurrence) => occurrence.startsAt);
  const occurrenceCreditPrices = paired.map((occurrence) => occurrence.creditPrice);
  const occurrenceCapacities =
    capacityPresence === "all"
      ? paired.map((occurrence) => occurrence.capacity ?? Number.NaN)
      : undefined;
  const dateTime = primaryDateTimeFromList(dateTimes, now);

  return {
    ok: true,
    value: {
      dateTimes,
      occurrenceCreditPrices,
      ...(occurrenceCapacities ? { occurrenceCapacities } : {}),
      dateTime,
      creditPrice: primaryCreditFromLists(dateTimes, occurrenceCreditPrices, dateTime),
    },
  };
}

/**
 * Pair parallel arrays by index, then normalize. Length mismatch is rejected before pairing.
 */
export function tryNormalizePairedDateTimesAndCredits(
  dateTimes: Date[],
  occurrenceCreditPrices: number[],
  now: Date = new Date(),
): NormalizeOccurrencesResult {
  if (dateTimes.length !== occurrenceCreditPrices.length) {
    return { ok: false, code: "LENGTH_MISMATCH" };
  }
  return tryNormalizeEventOccurrences(
    dateTimes.map((startsAt, index) => ({
      startsAt,
      creditPrice: occurrenceCreditPrices[index] ?? Number.NaN,
    })),
    now,
  );
}

/**
 * Legacy single-price path: unique-sort `dateTimes`, then fill every credit with `creditPrice`.
 */
export function tryFillOccurrenceCreditsFromPrice(
  dateTimes: Date[],
  creditPrice: number,
  now: Date = new Date(),
): NormalizeOccurrencesResult {
  if (!isValidCreditPrice(creditPrice)) {
    return { ok: false, code: "NEGATIVE_CREDIT" };
  }
  const normalized = tryNormalizeEventDateTimes(dateTimes, now);
  if (!normalized) {
    return { ok: false, code: "EMPTY" };
  }
  const occurrenceCreditPrices = normalized.dateTimes.map(() => creditPrice);
  return {
    ok: true,
    value: {
      dateTimes: normalized.dateTimes,
      occurrenceCreditPrices,
      dateTime: normalized.dateTime,
      creditPrice,
    },
  };
}

/**
 * Pair dates + credits + capacities by index, then normalize. Credit or capacity
 * length mismatch is rejected before pairing.
 */
export function tryNormalizePairedDateTimesCreditsAndCapacities(
  dateTimes: Date[],
  occurrenceCreditPrices: number[],
  occurrenceCapacities: number[],
  now: Date = new Date(),
): NormalizeOccurrencesResult {
  if (dateTimes.length !== occurrenceCreditPrices.length) {
    return { ok: false, code: "LENGTH_MISMATCH" };
  }
  if (dateTimes.length !== occurrenceCapacities.length) {
    return { ok: false, code: "CAPACITY_LENGTH_MISMATCH" };
  }
  return tryNormalizeEventOccurrences(
    dateTimes.map((startsAt, index) => ({
      startsAt,
      creditPrice: occurrenceCreditPrices[index] ?? Number.NaN,
      capacity: occurrenceCapacities[index],
    })),
    now,
  );
}

/**
 * Pair dates + capacities by index, fill every credit with `creditPrice`.
 * Does **not** unique-merge.
 */
export function tryNormalizePairedDateTimesAndCapacities(
  dateTimes: Date[],
  creditPrice: number,
  occurrenceCapacities: number[],
  now: Date = new Date(),
): NormalizeOccurrencesResult {
  if (!isValidCreditPrice(creditPrice)) {
    return { ok: false, code: "NEGATIVE_CREDIT" };
  }
  if (dateTimes.length !== occurrenceCapacities.length) {
    return { ok: false, code: "CAPACITY_LENGTH_MISMATCH" };
  }
  return tryNormalizeEventOccurrences(
    dateTimes.map((startsAt, index) => ({
      startsAt,
      creditPrice,
      capacity: occurrenceCapacities[index],
    })),
    now,
  );
}

/** SHARED fill: one capacity value repeated for every datetime. */
export function fillOccurrenceCapacities(dateTimes: Date[], totalCapacity: number): number[] {
  return dateTimes.map(() => totalCapacity);
}

/** Calendar date (YYYY-MM-DD) of `date` in Europe/Berlin. */
export function getBerlinCalendarDate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: BERLIN_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Inclusive start / exclusive end UTC bounds for the Europe/Berlin calendar day
 * containing `now`.
 */
export function berlinTodayRange(now: Date): BerlinDayRange {
  const ymd = getBerlinCalendarDate(now);
  return berlinInclusiveDateRange(ymd, ymd);
}

/**
 * Inclusive full-day Europe/Berlin range for `from`/`to` (YYYY-MM-DD or Date).
 * `end` is exclusive (start of the next Berlin calendar day after `to`).
 */
export function berlinInclusiveDateRange(from: string | Date, to: string | Date): BerlinDayRange {
  const fromYmd = normalizeBerlinYmd(from);
  const toYmd = normalizeBerlinYmd(to);
  const startYmd = fromYmd <= toYmd ? fromYmd : toYmd;
  const endYmd = fromYmd <= toYmd ? toYmd : fromYmd;

  return {
    start: berlinDayStartUtc(startYmd),
    end: berlinDayStartUtc(nextCalendarYmd(endYmd)),
  };
}

function normalizeBerlinYmd(value: string | Date): string {
  if (value instanceof Date) {
    return getBerlinCalendarDate(value);
  }

  const trimmed = value.trim();
  if (!YMD_RE.test(trimmed)) {
    throw new Error(`Invalid Berlin calendar date: ${value}`);
  }

  return trimmed;
}

function nextCalendarYmd(ymd: string): string {
  const match = YMD_RE.exec(ymd);
  if (!match) {
    throw new Error(`Invalid Berlin calendar date: ${ymd}`);
  }

  const year = Number.parseInt(match[1] ?? "0", 10);
  const month = Number.parseInt(match[2] ?? "0", 10);
  const day = Number.parseInt(match[3] ?? "0", 10);
  const next = new Date(Date.UTC(year, month - 1, day + 1, 12, 0, 0));

  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

/** Earliest UTC instant whose Europe/Berlin calendar date equals `ymd`. */
function berlinDayStartUtc(ymd: string): Date {
  const match = YMD_RE.exec(ymd);
  if (!match) {
    throw new Error(`Invalid Berlin calendar date: ${ymd}`);
  }

  const year = Number.parseInt(match[1] ?? "0", 10);
  const month = Number.parseInt(match[2] ?? "0", 10);
  const day = Number.parseInt(match[3] ?? "0", 10);

  // Search window covers CET/CEST offsets around the nominal UTC midnight.
  let lo = Date.UTC(year, month - 1, day, 0, 0, 0) - 36 * 3_600_000;
  let hi = Date.UTC(year, month - 1, day, 0, 0, 0) + 36 * 3_600_000;

  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (getBerlinCalendarDate(new Date(mid)) < ymd) {
      lo = mid + 1;
    } else {
      hi = mid;
    }
  }

  return new Date(lo);
}

function getBerlinWeekday(dateTime: Date): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: BERLIN_TZ,
    weekday: "short",
  }).format(dateTime);

  const mapped = WEEKDAY_MAP[weekday];
  if (mapped === undefined) {
    throw new Error(`Unexpected Berlin weekday label: ${weekday}`);
  }

  return mapped;
}

function getBerlinTimeParts(dateTime: Date): { hour: number; minute: number; weekday: number } {
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: BERLIN_TZ,
    hour: "2-digit",
    minute: "2-digit",
    weekday: "short",
    hour12: false,
  });

  const parts = Object.fromEntries(
    formatter
      .formatToParts(dateTime)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  );

  const weekday = WEEKDAY_MAP[parts.weekday ?? ""];
  if (weekday === undefined) {
    throw new Error(`Unexpected Berlin weekday label: ${parts.weekday}`);
  }

  return {
    hour: Number.parseInt(parts.hour ?? "0", 10),
    minute: Number.parseInt(parts.minute ?? "0", 10),
    weekday,
  };
}
