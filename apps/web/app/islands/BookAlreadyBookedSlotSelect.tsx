import { Label, Surface } from "@heroui/react";
import { useMemo } from "react";

import { type CheckoutOccurrence, formatOccurrenceLabel } from "../lib/checkout-slot";
import type { Locale } from "../lib/locale";

export type BookAlreadyBookedSlotSelectProps = {
  locale: Locale;
  occurrences: CheckoutOccurrence[];
  selectedIso?: string;
  datetimeLabel: string;
  /** Localized book path without query, e.g. `/de/events/:id/book`. */
  actionPath: string;
  /** When false, slot labels omit clock time (all-day events). Default true. */
  includeTime?: boolean;
};

export default function BookAlreadyBookedSlotSelect({
  locale,
  occurrences,
  selectedIso,
  datetimeLabel,
  actionPath,
  includeTime = true,
}: BookAlreadyBookedSlotSelectProps) {
  const datetimeSelectId = "book-already-booked-datetime";
  const options = useMemo(
    () =>
      occurrences.map((occurrence) => ({
        ...occurrence,
        label: formatOccurrenceLabel(occurrence.startsAtIso, locale, { includeTime }),
      })),
    [includeTime, occurrences, locale],
  );
  const value = selectedIso ?? options[0]?.startsAtIso;

  return (
    <Surface className="flex w-full flex-col gap-1" variant="transparent">
      <Label htmlFor={datetimeSelectId}>{datetimeLabel}</Label>
      <select
        className="event-feed-filters__select"
        id={datetimeSelectId}
        onChange={(event) => {
          const nextIso = event.currentTarget.value;
          const url = new URL(actionPath, window.location.origin);
          url.searchParams.set("dateTime", nextIso);
          window.location.assign(`${url.pathname}${url.search}`);
        }}
        value={value}
      >
        {options.map((option) => (
          <option key={option.startsAtIso} value={option.startsAtIso}>
            {option.label}
          </option>
        ))}
      </select>
    </Surface>
  );
}
