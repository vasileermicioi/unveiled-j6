"use client";

import { Button, Link, Paragraph, Surface } from "@heroui/react";
import { useState } from "react";

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
  /** Inclusive upper bound for +/− controls (guest 3; signed-in credits ∩ capacity). */
  maxQty: number;
  ticketsLabel: string;
  totalLabel: string;
  noticeText: string | null;
  policyText: string;
  showTicketControls: boolean;
  defaultQty?: number;
  statusMessage?: string | null;
  primaryAction: CheckoutPrimaryAction | null;
  secondaryAction?: CheckoutSecondaryAction | null;
  decreaseAriaLabel: string;
  increaseAriaLabel: string;
};

function clampQty(value: number, maxQty: number): number {
  if (!Number.isFinite(value)) {
    return MIN_QTY;
  }
  if (maxQty < MIN_QTY) {
    return MIN_QTY;
  }
  return Math.min(maxQty, Math.max(MIN_QTY, Math.trunc(value)));
}

function withQtyQuery(path: string, qty: number): string {
  const url = new URL(path, "https://unveiled.local");
  url.searchParams.set("qty", String(qty));
  return `${url.pathname}${url.search}`;
}

function resolvePrimaryHref(action: CheckoutPrimaryAction, qty: number): string {
  if (action.type === "book") {
    return withQtyQuery(action.bookPath, qty);
  }
  if (action.type === "login") {
    const returnTo = withQtyQuery(action.returnPath, qty);
    return `${action.loginPath}?returnTo=${encodeURIComponent(returnTo)}`;
  }
  return action.href;
}

function formatCreditsTotal(total: number, locale: Locale): string {
  if (locale === "de") {
    return `${total} CREDIT${total === 1 ? "" : "S"}`;
  }
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
  defaultQty = 1,
  statusMessage = null,
  primaryAction,
  secondaryAction = null,
  decreaseAriaLabel,
  increaseAriaLabel,
}: EventDetailCheckoutCardProps) {
  const [qty, setQty] = useState(() => clampQty(defaultQty, maxQty));
  const total = qty * creditPrice;
  const primaryHref = primaryAction ? resolvePrimaryHref(primaryAction, qty) : null;
  const increaseDisabled = maxQty < MIN_QTY || qty >= maxQty;

  return (
    <Surface className="event-detail--checkout__card">
      {showTicketControls ? (
        <>
          <Surface className="event-detail--checkout__row" variant="transparent">
            <Paragraph className="event-detail--checkout__row-label">{ticketsLabel}</Paragraph>
            <Surface className="event-detail--checkout__qty" variant="transparent">
              <Button
                aria-label={decreaseAriaLabel}
                className="event-detail--checkout__qty-btn"
                isDisabled={qty <= MIN_QTY}
                onPress={() => setQty((current) => clampQty(current - 1, maxQty))}
                type="button"
              >
                −
              </Button>
              <Paragraph className="event-detail--checkout__qty-value">{qty}</Paragraph>
              <Button
                aria-label={increaseAriaLabel}
                className="event-detail--checkout__qty-btn"
                isDisabled={increaseDisabled}
                onPress={() => setQty((current) => clampQty(current + 1, maxQty))}
                type="button"
              >
                +
              </Button>
            </Surface>
          </Surface>
          <Surface className="event-detail--checkout__divider" variant="transparent">
            <Paragraph className="sr-only">—</Paragraph>
          </Surface>
          <Surface className="event-detail--checkout__row" variant="transparent">
            <Paragraph className="event-detail--checkout__row-label">{totalLabel}</Paragraph>
            <Paragraph className="event-detail--checkout__total-value">
              {formatCreditsTotal(total, locale)}
            </Paragraph>
          </Surface>
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
