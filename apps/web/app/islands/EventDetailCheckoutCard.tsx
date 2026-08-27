import { Label, Link, Paragraph, Surface } from "@heroui/react";
import { useMemo, useState } from "react";

import {
  type CheckoutOccurrence,
  formatOccurrenceLabel,
  occurrenceIsBooked,
  resolveSelectedOccurrence,
  withDateTimeQuery,
} from "../lib/checkout-slot";
import type { Locale } from "../lib/locale";

export type CheckoutPrimaryAction =
  | { type: "book"; bookPath: string; label: string }
  | { type: "login"; loginPath: string; returnPath: string; label: string }
  | { type: "link"; href: string; label: string };

export type CheckoutSecondaryAction = {
  href: string;
  label: string;
};

export type EventDetailCheckoutCardProps = {
  locale: Locale;
  creditPrice: number;
  totalLabel: string;
  noticeText: string | null;
  policyText: string;
  /** Eligible-member chrome: datetime select (when ≥2 slots) + one-ticket credit total. */
  showTicketControls: boolean;
  /** Credit total row — booking-eligible members only; guests omit pricing chrome. */
  showCreditTotal?: boolean;
  statusMessage?: string | null;
  primaryAction: CheckoutPrimaryAction | null;
  secondaryAction?: CheckoutSecondaryAction | null;
  /** Future occurrences for eligible members. Omit for guests. */
  occurrences?: CheckoutOccurrence[];
  defaultDateTimeIso?: string;
  datetimeLabel?: string;
  /** Active booked occurrence ISOs for the eligible member; overlay is per selected hour. */
  bookedOccurrenceIsos?: string[];
  alreadyBookedMessage?: string;
  myTicketsHref?: string;
  myTicketsLabel?: string;
};

function resolvePrimaryHref(action: CheckoutPrimaryAction, dateTimeIso?: string): string {
  if (action.type === "book") {
    return withDateTimeQuery(action.bookPath, dateTimeIso);
  }
  if (action.type === "login") {
    const returnTo = withDateTimeQuery(action.returnPath);
    return `${action.loginPath}?returnTo=${encodeURIComponent(returnTo)}`;
  }
  return action.href;
}

function formatCreditsTotal(total: number): string {
  return `${total} CREDIT${total === 1 ? "" : "S"}`;
}

export default function EventDetailCheckoutCard({
  locale,
  creditPrice,
  totalLabel,
  noticeText,
  policyText,
  showTicketControls,
  showCreditTotal = false,
  statusMessage = null,
  primaryAction,
  secondaryAction = null,
  occurrences = [],
  defaultDateTimeIso,
  datetimeLabel,
  bookedOccurrenceIsos = [],
  alreadyBookedMessage,
  myTicketsHref,
  myTicketsLabel,
}: EventDetailCheckoutCardProps) {
  const [selectedIso, setSelectedIso] = useState(
    () => resolveSelectedOccurrence(occurrences, defaultDateTimeIso)?.startsAtIso,
  );
  const selected = resolveSelectedOccurrence(occurrences, selectedIso ?? defaultDateTimeIso);
  const slotPrice = selected?.creditPrice ?? creditPrice;
  const total = slotPrice;
  const dateTimeIso = selected?.startsAtIso;
  const overlayAlreadyBooked =
    showTicketControls &&
    alreadyBookedMessage != null &&
    myTicketsHref != null &&
    myTicketsLabel != null &&
    occurrenceIsBooked(dateTimeIso, bookedOccurrenceIsos);
  const overlayPrimaryAction: CheckoutPrimaryAction | null = overlayAlreadyBooked
    ? { type: "link", href: myTicketsHref, label: myTicketsLabel }
    : primaryAction;
  const overlaySecondaryAction = overlayAlreadyBooked ? null : secondaryAction;
  const overlayNoticeText = overlayAlreadyBooked ? null : noticeText;
  const overlayStatusMessage = overlayAlreadyBooked ? alreadyBookedMessage : statusMessage;
  const overlayShowCreditTotal = overlayAlreadyBooked ? false : showCreditTotal;
  const primaryHref = overlayPrimaryAction
    ? resolvePrimaryHref(overlayPrimaryAction, dateTimeIso)
    : null;
  const showDatetimeSelect = occurrences.length >= 2;
  const datetimeSelectId = "event-detail-checkout-datetime";

  const options = useMemo(
    () =>
      occurrences.map((occurrence) => ({
        ...occurrence,
        label: formatOccurrenceLabel(occurrence.startsAtIso, locale),
      })),
    [occurrences, locale],
  );

  return (
    <Surface className="event-detail--checkout__card">
      {showTicketControls ? (
        <>
          {showDatetimeSelect && datetimeLabel ? (
            <Surface
              className="event-detail--checkout__row flex flex-col gap-1"
              variant="transparent"
            >
              <Label htmlFor={datetimeSelectId}>{datetimeLabel}</Label>
              <select
                className="event-feed-filters__select"
                id={datetimeSelectId}
                onChange={(event) => {
                  setSelectedIso(event.currentTarget.value);
                }}
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
          {overlayShowCreditTotal ? (
            <>
              <Surface className="event-detail--checkout__divider" variant="transparent">
                <Paragraph className="sr-only">—</Paragraph>
              </Surface>
              <Surface className="event-detail--checkout__row" variant="transparent">
                <Paragraph className="event-detail--checkout__row-label">{totalLabel}</Paragraph>
                <Paragraph className="event-detail--checkout__total-value">
                  {formatCreditsTotal(total)}
                </Paragraph>
              </Surface>
            </>
          ) : null}
        </>
      ) : null}

      {overlayStatusMessage ? (
        <Paragraph className="event-detail--checkout__status">{overlayStatusMessage}</Paragraph>
      ) : null}

      {overlayNoticeText ? (
        <Surface className="event-detail--checkout__notice" variant="transparent">
          <Paragraph className="event-detail--checkout__notice-text">{overlayNoticeText}</Paragraph>
        </Surface>
      ) : null}

      {primaryHref && overlayPrimaryAction ? (
        <Link
          className="button button--primary button--md event-detail--checkout__cta"
          href={primaryHref}
        >
          {overlayPrimaryAction.label}
        </Link>
      ) : null}

      {overlaySecondaryAction ? (
        <Link
          className="button button--secondary button--md event-detail--checkout__cta"
          href={overlaySecondaryAction.href}
        >
          {overlaySecondaryAction.label}
        </Link>
      ) : null}

      <Paragraph className="event-detail--checkout__policy">{policyText}</Paragraph>
    </Surface>
  );
}
