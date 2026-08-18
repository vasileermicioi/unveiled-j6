import { getBerlinCalendarDate } from "@unveiled/db";

import type { Locale } from "./locale";

export type EventDetailWhenLine = {
  key: string;
  label: string;
  isNext: boolean;
};

const BERLIN_TZ = "Europe/Berlin";

function intlLocale(locale: Locale): string {
  return locale === "de" ? "de-DE" : "en-GB";
}

/** Europe/Berlin date+time for map popups and DETAILS when hours are omitted. */
export function formatEventDateTime(dateTime: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: BERLIN_TZ,
  }).format(dateTime);
}

function formatEventDate(dateTime: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: BERLIN_TZ,
  }).format(dateTime);
}

function sortedDateTimes(dateTimes: Date[]): Date[] {
  return [...dateTimes].sort((a, b) => a.getTime() - b.getTime());
}

/**
 * DETAILS Date lines. When `includeTime` is false, unique by Europe/Berlin YMD
 * and omit clock time; `isNext` follows `nextDateTime`'s Berlin calendar day.
 */
export function formatEventDetailWhenLines(
  dateTimes: Date[],
  nextDateTime: Date,
  locale: Locale,
  options: { includeTime: boolean },
): EventDetailWhenLine[] {
  const ordered = sortedDateTimes(dateTimes.length > 0 ? dateTimes : [nextDateTime]);

  if (options.includeTime) {
    return ordered.map((dateTime) => ({
      key: dateTime.toISOString(),
      label: formatEventDateTime(dateTime, locale),
      isNext: dateTime.getTime() === nextDateTime.getTime(),
    }));
  }

  const nextYmd = getBerlinCalendarDate(nextDateTime);
  const seen = new Set<string>();
  const lines: EventDetailWhenLine[] = [];

  for (const dateTime of ordered) {
    const ymd = getBerlinCalendarDate(dateTime);
    if (seen.has(ymd)) {
      continue;
    }
    seen.add(ymd);
    lines.push({
      key: ymd,
      label: formatEventDate(dateTime, locale),
      isNext: ymd === nextYmd,
    });
  }

  return lines;
}
