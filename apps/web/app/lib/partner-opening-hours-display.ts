import {
  OPENING_HOURS_DAY_KEYS,
  type OpeningHoursDayKey,
  type OpeningHoursWeek,
  parseOpeningHours,
} from "@unveiled/db";

import type { Locale } from "./locale";

export type OpeningHoursDisplayLine = {
  dayKey: OpeningHoursDayKey;
  dayLabel: string;
  /** Open–close range for the active locale. */
  hoursLabel: string;
};

const DAY_LABELS: Record<Locale, Record<OpeningHoursDayKey, string>> = {
  de: {
    mon: "Montag",
    tue: "Dienstag",
    wed: "Mittwoch",
    thu: "Donnerstag",
    fri: "Freitag",
    sat: "Samstag",
    sun: "Sonntag",
  },
  en: {
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
    sat: "Saturday",
    sun: "Sunday",
  },
};

function formatOpenClose(open: string, close: string): string {
  return `${open} – ${close}`;
}

/**
 * Build Mon→Sun working-day lines for public event detail.
 * Returns null when hours should be omitted (disabled, null, malformed, or every day closed).
 */
export function formatPartnerOpeningHoursLines(
  hasOpeningHours: boolean,
  openingHours: OpeningHoursWeek | null | undefined,
  locale: Locale,
): OpeningHoursDisplayLine[] | null {
  if (!hasOpeningHours || openingHours == null) {
    return null;
  }

  let week: OpeningHoursWeek;
  try {
    week = parseOpeningHours(openingHours);
  } catch {
    return null;
  }

  const dayLabels = DAY_LABELS[locale];
  const lines: OpeningHoursDisplayLine[] = [];

  for (const dayKey of OPENING_HOURS_DAY_KEYS) {
    const day = week[dayKey];
    if (!("open" in day)) {
      continue;
    }

    lines.push({
      dayKey,
      dayLabel: dayLabels[dayKey],
      hoursLabel: formatOpenClose(day.open, day.close),
    });
  }

  return lines.length === 0 ? null : lines;
}
