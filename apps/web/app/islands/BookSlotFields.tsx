"use client";

import { Label, Paragraph, Surface } from "@heroui/react";
import { useMemo, useState } from "react";

import {
  BOOK_DATE_TIME_INPUT_ID,
  type CheckoutOccurrence,
  clampQty,
  formatOccurrenceLabel,
  formatSlotUnitPrice,
  resolveSelectedOccurrence,
} from "../lib/checkout-slot";
import type { Locale } from "../lib/locale";
import TicketCountSelect from "./TicketCountSelect";

export type BookSlotFieldsProps = {
  locale: Locale;
  occurrences: CheckoutOccurrence[];
  defaultDateTimeIso?: string;
  defaultTickets: string;
  ticketsLabel: string;
  datetimeLabel: string;
};

function syncPostedDateTime(iso: string | undefined): void {
  if (typeof document === "undefined" || !iso) {
    return;
  }
  const hidden = document.getElementById(BOOK_DATE_TIME_INPUT_ID);
  if (hidden instanceof HTMLInputElement) {
    hidden.value = iso;
  }
}

export default function BookSlotFields({
  locale,
  occurrences,
  defaultDateTimeIso,
  defaultTickets,
  ticketsLabel,
  datetimeLabel,
}: BookSlotFieldsProps) {
  const [selectedIso, setSelectedIso] = useState(
    () => resolveSelectedOccurrence(occurrences, defaultDateTimeIso)?.startsAtIso,
  );
  const selected = resolveSelectedOccurrence(occurrences, selectedIso ?? defaultDateTimeIso);
  const slotMaxQty = selected?.maxQty ?? 1;
  const slotPrice = selected?.creditPrice ?? 0;
  const showSelect = occurrences.length >= 2;
  const datetimeSelectId = "book-slot-datetime";
  const initialTickets = String(clampQty(Number.parseInt(defaultTickets, 10), slotMaxQty));

  const options = useMemo(
    () =>
      occurrences.map((occurrence) => ({
        ...occurrence,
        label: formatOccurrenceLabel(occurrence.startsAtIso, locale),
      })),
    [occurrences, locale],
  );

  return (
    <Surface className="flex flex-col gap-6" variant="transparent">
      {selected ? (
        <Paragraph>
          {formatOccurrenceLabel(selected.startsAtIso, locale)} ·{" "}
          {formatSlotUnitPrice(slotPrice, locale)}
        </Paragraph>
      ) : null}
      {showSelect ? (
        <Surface className="flex w-full flex-col gap-1" variant="transparent">
          <Label htmlFor={datetimeSelectId}>{datetimeLabel}</Label>
          <select
            className="event-feed-filters__select"
            id={datetimeSelectId}
            onChange={(event) => {
              const nextIso = event.currentTarget.value;
              setSelectedIso(nextIso);
              syncPostedDateTime(nextIso);
            }}
            required
            value={selected?.startsAtIso ?? options[0]?.startsAtIso}
          >
            {options.map((option) => (
              <option key={option.startsAtIso} value={option.startsAtIso}>
                {option.label}
              </option>
            ))}
          </select>
        </Surface>
      ) : null}
      <TicketCountSelect
        defaultValue={initialTickets}
        key={`${selected?.startsAtIso ?? "slot"}-${slotMaxQty}`}
        label={ticketsLabel}
        maxQty={slotMaxQty}
        name="ticketsCount"
      />
    </Surface>
  );
}
