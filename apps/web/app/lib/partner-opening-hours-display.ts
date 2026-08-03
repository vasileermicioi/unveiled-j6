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
  /** Open–close range or closed label for the active locale. */
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

function closedLabel(locale: Locale): string {
  return locale === "de" ? "Geschlossen" : "Closed";
}

function formatOpenClose(open: string, close: string): string {
  return `${open} – ${close}`;
}

/**
 * Build Mon→Sun display lines for public event detail.
 * Returns null when hours should be omitted (disabled, null, or malformed).
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
  const closed = closedLabel(locale);

  return OPENING_HOURS_DAY_KEYS.map((dayKey) => {
    const day = week[dayKey];
    const hoursLabel =
      "closed" in day && day.closed === true
        ? closed
        : formatOpenClose("open" in day ? day.open : "", "close" in day ? day.close : "");

    return {
      dayKey,
      dayLabel: dayLabels[dayKey],
      hoursLabel,
    };
  });
}
