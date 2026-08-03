/** Weekday keys for partner opening hours (Europe/Berlin wall times). */
export const OPENING_HOURS_DAY_KEYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;

export type OpeningHoursDayKey = (typeof OPENING_HOURS_DAY_KEYS)[number];

export type OpeningHoursClosedDay = { closed: true };

export type OpeningHoursOpenDay = {
  open: string;
  close: string;
};

export type OpeningHoursDay = OpeningHoursClosedDay | OpeningHoursOpenDay;

export type OpeningHoursWeek = Record<OpeningHoursDayKey, OpeningHoursDay>;

const TIME_HH_MM = /^([01]\d|2[0-3]):([0-5]\d)$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseTimeToMinutes(value: string, field: string): number {
  const match = TIME_HH_MM.exec(value);
  if (!match) {
    throw new Error(`Invalid ${field}: expected HH:MM (24h, zero-padded minutes)`);
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

function parseDay(value: unknown, day: OpeningHoursDayKey): OpeningHoursDay {
  if (!isRecord(value)) {
    throw new Error(`Invalid opening hours for ${day}: expected an object`);
  }

  if (value.closed === true) {
    if ("open" in value || "close" in value) {
      throw new Error(`Invalid opening hours for ${day}: closed day must not include open/close`);
    }
    return { closed: true };
  }

  if (typeof value.open !== "string" || typeof value.close !== "string") {
    throw new Error(
      `Invalid opening hours for ${day}: expected { closed: true } or { open, close }`,
    );
  }

  const openMinutes = parseTimeToMinutes(value.open, `${day}.open`);
  const closeMinutes = parseTimeToMinutes(value.close, `${day}.close`);
  if (openMinutes >= closeMinutes) {
    throw new Error(`Invalid opening hours for ${day}: open must be strictly before close`);
  }

  return { open: value.open, close: value.close };
}

/**
 * Parse an unknown payload into a typed seven-day week.
 * Throws Error with a human-readable message on invalid shape (callers map to CatalogValidationError).
 */
export function parseOpeningHours(value: unknown): OpeningHoursWeek {
  if (!isRecord(value)) {
    throw new Error("opening_hours must be an object with mon–sun keys");
  }

  const week = {} as OpeningHoursWeek;
  for (const day of OPENING_HOURS_DAY_KEYS) {
    if (!(day in value)) {
      throw new Error(`opening_hours missing day key: ${day}`);
    }
    week[day] = parseDay(value[day], day);
  }

  for (const key of Object.keys(value)) {
    if (!(OPENING_HOURS_DAY_KEYS as readonly string[]).includes(key)) {
      throw new Error(`opening_hours has unknown day key: ${key}`);
    }
  }

  return week;
}

/**
 * Resolve hours for a partner write.
 * When disabled, always returns null hours (clears any previous schedule).
 * When enabled, requires a full valid week.
 */
export function assertOpeningHoursForWrite(
  hasOpeningHours: boolean,
  openingHours: unknown,
): OpeningHoursWeek | null {
  if (!hasOpeningHours) {
    return null;
  }

  if (openingHours == null) {
    throw new Error("opening_hours is required when has_opening_hours is true");
  }

  return parseOpeningHours(openingHours);
}
