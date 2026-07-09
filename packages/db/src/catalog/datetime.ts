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
