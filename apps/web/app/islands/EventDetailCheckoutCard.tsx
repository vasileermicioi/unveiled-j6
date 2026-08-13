"use client";

import { Button, Label, Link, Paragraph, Surface } from "@heroui/react";
import { useMemo, useState } from "react";

import {
  type CheckoutOccurrence,
  clampQty,
  formatOccurrenceLabel,
  resolveSelectedOccurrence,
  withQtyAndDateTimeQuery,
} from "../lib/checkout-slot";
import type { Locale } from "../lib/locale";

const MIN_QTY = 1;

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
  /** Inclusive upper bound for +/− controls (eligible: credits ∩ capacity). */
  maxQty: number;
  ticketsLabel: string;
  totalLabel: string;
  noticeText: string | null;
  policyText: string;
  showTicketControls: boolean;
  /** Credit total row — booking-eligible members only; guests omit pricing chrome. */
  showCreditTotal?: boolean;
  defaultQty?: number;
  statusMessage?: string | null;
  primaryAction: CheckoutPrimaryAction | null;
  secondaryAction?: CheckoutSecondaryAction | null;
  decreaseAriaLabel: string;
  increaseAriaLabel: string;
  /** Future occurrences for eligible members. Omit for guests. */
  occurrences?: CheckoutOccurrence[];
  defaultDateTimeIso?: string;
  datetimeLabel?: string;
};

function resolvePrimaryHref(
  action: CheckoutPrimaryAction,
  qty: number,
  dateTimeIso?: string,
): string {
  if (action.type === "book") {
    return withQtyAndDateTimeQuery(action.bookPath, qty, dateTimeIso);
  }
  if (action.type === "login") {
    const returnTo = withQtyAndDateTimeQuery(action.returnPath, qty);
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
  maxQty,
  ticketsLabel,
  totalLabel,
  noticeText,
  policyText,
  showTicketControls,
  showCreditTotal = false,
  defaultQty = 1,
  statusMessage = null,
  primaryAction,
  secondaryAction = null,
  decreaseAriaLabel,
  increaseAriaLabel,
  occurrences = [],
  defaultDateTimeIso,
  datetimeLabel,
}: EventDetailCheckoutCardProps) {
  const [selectedIso, setSelectedIso] = useState(
    () => resolveSelectedOccurrence(occurrences, defaultDateTimeIso)?.startsAtIso,
  );
  const selected = resolveSelectedOccurrence(occurrences, selectedIso ?? defaultDateTimeIso);
  const slotPrice = selected?.creditPrice ?? creditPrice;
  const slotMaxQty = selected?.maxQty ?? maxQty;
  const [qty, setQty] = useState(() => clampQty(defaultQty, slotMaxQty));
  const clampedQty = clampQty(qty, slotMaxQty);
  const total = clampedQty * slotPrice;
  const dateTimeIso = selected?.startsAtIso;
  const primaryHref = primaryAction
    ? resolvePrimaryHref(primaryAction, clampedQty, dateTimeIso)
    : null;
  const increaseDisabled = slotMaxQty < MIN_QTY || clampedQty >= slotMaxQty;
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
                  const nextIso = event.currentTarget.value;
                  setSelectedIso(nextIso);
                  const next = resolveSelectedOccurrence(occurrences, nextIso);
                  if (next) {
                    setQty((current) => clampQty(current, next.maxQty));
                  }
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
          <Surface className="event-detail--checkout__row" variant="transparent">
            <Paragraph className="event-detail--checkout__row-label">{ticketsLabel}</Paragraph>
            <Surface className="event-detail--checkout__qty" variant="transparent">
              <Button
                aria-label={decreaseAriaLabel}
                className="event-detail--checkout__qty-btn"
                isDisabled={clampedQty <= MIN_QTY}
                onPress={() => setQty((current) => clampQty(current - 1, slotMaxQty))}
                type="button"
              >
                −
              </Button>
              <Paragraph className="event-detail--checkout__qty-value">{clampedQty}</Paragraph>
              <Button
                aria-label={increaseAriaLabel}
                className="event-detail--checkout__qty-btn"
                isDisabled={increaseDisabled}
                onPress={() => setQty((current) => clampQty(current + 1, slotMaxQty))}
                type="button"
              >
                +
              </Button>
            </Surface>
          </Surface>
          {showCreditTotal ? (
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

      {statusMessage ? (
        <Paragraph className="event-detail--checkout__status">{statusMessage}</Paragraph>
      ) : null}

      {noticeText ? (
        <Surface className="event-detail--checkout__notice" variant="transparent">
          <Paragraph className="event-detail--checkout__notice-text">{noticeText}</Paragraph>
        </Surface>
      ) : null}

      {primaryHref && primaryAction ? (
        <Link
          className="button button--primary button--md event-detail--checkout__cta"
          href={primaryHref}
        >
          {primaryAction.label}
        </Link>
      ) : null}

      {secondaryAction ? (
        <Link
          className="button button--secondary button--md event-detail--checkout__cta"
          href={secondaryAction.href}
        >
          {secondaryAction.label}
        </Link>
      ) : null}

      <Paragraph className="event-detail--checkout__policy">{policyText}</Paragraph>
    </Surface>
  );
}
