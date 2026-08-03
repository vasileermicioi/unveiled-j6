import {
  OPENING_HOURS_DAY_KEYS,
  type OpeningHoursDayKey,
  type OpeningHoursWeek,
} from "@unveiled/db";

export type PartnerOpeningHoursDayForm = {
  closed: boolean;
  open: string;
  close: string;
};

export type PartnerOpeningHoursDaysForm = Record<OpeningHoursDayKey, PartnerOpeningHoursDayForm>;

export type PartnerOpeningHoursWriteInput = {
  hasOpeningHours: boolean;
  openingHours: OpeningHoursWeek | null;
};

type AsString = (value: string | File | (string | File)[] | undefined) => string | undefined;

function isCheckboxOn(value: string | undefined): boolean {
  if (value === undefined) {
    return false;
  }
  const normalized = value.trim().toLowerCase();
  return normalized === "on" || normalized === "true" || normalized === "1" || normalized === "yes";
}

/** Normalize browser `type="time"` values to `HH:MM` (zero-padded hour). */
export function normalizeTimeInput(raw: string): string {
  const trimmed = raw.trim();
  const match = /^(\d{1,2}):([0-5]\d)(?::([0-5]\d))?$/.exec(trimmed);
  if (!match) {
    return trimmed;
  }
  const hour = Number(match[1]);
  if (hour > 23) {
    return trimmed;
  }
  return `${String(hour).padStart(2, "0")}:${match[2]}`;
}

export function emptyOpeningHoursDaysForm(defaultClosed = true): PartnerOpeningHoursDaysForm {
  const days = {} as PartnerOpeningHoursDaysForm;
  for (const day of OPENING_HOURS_DAY_KEYS) {
    days[day] = { closed: defaultClosed, open: "", close: "" };
  }
  return days;
}

export function openingHoursWeekToFormDays(
  week: OpeningHoursWeek | null | undefined,
): PartnerOpeningHoursDaysForm {
  const days = emptyOpeningHoursDaysForm(true);
  if (!week) {
    return days;
  }

  for (const day of OPENING_HOURS_DAY_KEYS) {
    const value = week[day];
    if (value && "closed" in value && value.closed === true) {
      days[day] = { closed: true, open: "", close: "" };
    } else if (value && "open" in value && "close" in value) {
      days[day] = {
        closed: false,
        open: value.open,
        close: value.close,
      };
    }
  }
  return days;
}

export function parseOpeningHoursFormFromBody(
  body: Record<string, string | File | (string | File)[]>,
  asString: AsString,
): {
  hasOpeningHours: boolean;
  openingHoursDays: PartnerOpeningHoursDaysForm;
} {
  const hasOpeningHours = isCheckboxOn(asString(body.has_opening_hours));
  const openingHoursDays = emptyOpeningHoursDaysForm(true);

  for (const day of OPENING_HOURS_DAY_KEYS) {
    openingHoursDays[day] = {
      closed: isCheckboxOn(asString(body[`closed_${day}`])),
      open: asString(body[`open_${day}`])?.trim() ?? "",
      close: asString(body[`close_${day}`])?.trim() ?? "",
    };
  }

  return { hasOpeningHours, openingHoursDays };
}

/**
 * Map form state to domain write input.
 * Domain validation (`assertOpeningHoursForWrite` / createPartner) remains authoritative.
 */
export function openingHoursFormToWriteInput(
  hasOpeningHours: boolean,
  openingHoursDays: PartnerOpeningHoursDaysForm,
): PartnerOpeningHoursWriteInput {
  if (!hasOpeningHours) {
    return { hasOpeningHours: false, openingHours: null };
  }

  const week = {} as OpeningHoursWeek;
  for (const day of OPENING_HOURS_DAY_KEYS) {
    const row = openingHoursDays[day];
    if (row.closed) {
      week[day] = { closed: true };
    } else {
      week[day] = {
        open: normalizeTimeInput(row.open),
        close: normalizeTimeInput(row.close),
      };
    }
  }

  return { hasOpeningHours: true, openingHours: week };
}
