import { Button, Card, Chip, Link, Paragraph, Surface } from "@heroui/react";

import { buildCardImageSrc, buildCardImageSrcSet } from "./image-urls";
import type { CatalogLocale, EventCardItem, EventCardViewerState } from "./types";

export type EventCardProps = {
  event: EventCardItem;
  locale: CatalogLocale;
  viewer?: EventCardViewerState;
  ctaHref?: string;
  onBookmarkToggle?: () => void;
};

function formatEventDate(dateTime: Date, locale: CatalogLocale): string {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  }).format(dateTime);
}

function creditLabel(creditPrice: number, locale: CatalogLocale): string {
  if (locale === "de") {
    return `${creditPrice} Credit${creditPrice === 1 ? "" : "s"}`;
  }
  return `${creditPrice} credit${creditPrice === 1 ? "" : "s"}`;
}

function ticketTypeLabel(ticketType: EventCardItem["ticketType"], locale: CatalogLocale): string {
  if (ticketType === "VOUCHER") {
    return locale === "de" ? "Gutschein" : "Voucher";
  }
  return locale === "de" ? "Geheimcode" : "Secret code";
}

function guestCtaLabel(locale: CatalogLocale): string {
  return locale === "de" ? "Mehr sehen" : "See details";
}

function waitlistCtaLabel(locale: CatalogLocale): string {
  return locale === "de" ? "Warteliste" : "Waitlist";
}

function unlockCtaLabel(locale: CatalogLocale): string {
  return locale === "de" ? "Mit Abo öffnen" : "Unlock event";
}

function bookCtaLabel(locale: CatalogLocale): string {
  return locale === "de" ? "Bin dabei" : "Book Now";
}

function saveAriaLabel(saved: boolean, locale: CatalogLocale): string {
  if (locale === "de") {
    return saved ? "Gespeichertes Event" : "Event speichern";
  }
  return saved ? "Saved event" : "Save event";
}

function availabilityLabel(remainingCapacity: number, locale: CatalogLocale): string {
  if (locale === "de") {
    return `Verfügbar: ${remainingCapacity}`;
  }
  return `Available: ${remainingCapacity}`;
}

export function resolveEventCardCta(
  viewer: EventCardViewerState,
  soldOut: boolean,
  locale: CatalogLocale,
): string {
  if (viewer.kind === "guest") {
    return guestCtaLabel(locale);
  }
  if (soldOut) {
    return waitlistCtaLabel(locale);
  }
  if (!viewer.subscriptionActive) {
    return unlockCtaLabel(locale);
  }
  return bookCtaLabel(locale);
}

export function EventCard({
  event,
  locale,
  viewer = { kind: "guest" },
  ctaHref,
  onBookmarkToggle,
}: EventCardProps) {
  const soldOut = event.remainingCapacity <= 0;
  const ctaLabel = resolveEventCardCta(viewer, soldOut, locale);
  const isGuest = viewer.kind === "guest";
  const saved = viewer.kind === "member" ? Boolean(viewer.saved) : false;
  const bookmarkDisabled = isGuest || !onBookmarkToggle;

  let imageSrc = "";
  let imageSrcSet = "";
  try {
    imageSrc = buildCardImageSrc(event.imageId);
    imageSrcSet = buildCardImageSrcSet(event.imageId);
  } catch {
    imageSrc = "";
    imageSrcSet = "";
  }

  return (
    <Card className="event-card">
      <Card.Header className="event-card__header">
        <Surface className="event-card__image" variant="transparent">
          {imageSrc ? (
            <img
              alt=""
              className="event-card__image-el"
              decoding="async"
              loading="lazy"
              sizes="(max-width: 640px) 100vw, 640px"
              src={imageSrc}
              srcSet={imageSrcSet}
            />
          ) : null}
          <Chip className="event-card__category" size="sm">
            {event.category}
          </Chip>
          <Surface className="event-card__availability" variant="transparent">
            <Paragraph size="xs">{availabilityLabel(event.remainingCapacity, locale)}</Paragraph>
            <Paragraph className="event-card__ticket-type" size="xs">
              {ticketTypeLabel(event.ticketType, locale)}
            </Paragraph>
          </Surface>
        </Surface>
      </Card.Header>
      <Card.Content className="flex flex-col gap-2">
        <Card.Title className="event-card__title">{event.title}</Card.Title>
        <Paragraph color="muted" size="sm">
          {event.partnerName}
        </Paragraph>
        <Paragraph size="sm">{formatEventDate(event.dateTime, locale)}</Paragraph>
        <Paragraph size="sm">{event.neighborhood}</Paragraph>
      </Card.Content>
      <Card.Footer className="event-card__footer">
        <Paragraph className="event-card__price" size="sm">
          {creditLabel(event.creditPrice, locale)}
        </Paragraph>
        <Surface className="event-card__actions" variant="transparent">
          <Button
            aria-label={saveAriaLabel(saved, locale)}
            className="event-card__bookmark"
            isDisabled={bookmarkDisabled}
            onPress={bookmarkDisabled ? undefined : onBookmarkToggle}
            size="sm"
            variant="ghost"
          >
            {saved ? "★" : "☆"}
          </Button>
          <Link className="button button--secondary button--md" href={ctaHref ?? "#"}>
            {ctaLabel}
          </Link>
        </Surface>
      </Card.Footer>
    </Card>
  );
}
