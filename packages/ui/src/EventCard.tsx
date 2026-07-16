import { Button, Card, Chip, Form, Input, Link, Paragraph, Surface } from "@heroui/react";
import { Bookmark, Calendar, MapPin } from "lucide-react";
import type { ReactNode } from "react";

import { buildCardImageSrc, buildCardImageSrcSet } from "./image-urls";
import type { CatalogLocale, EventCardItem, EventCardViewerState } from "./types";

export type EventCardProps = {
  event: EventCardItem;
  locale: CatalogLocale;
  viewer?: EventCardViewerState;
  ctaHref?: string;
  /** Client-only toggle (stories / islands). Prefer `bookmarkFormAction` for SSR. */
  onBookmarkToggle?: () => void;
  /** When set, bookmark renders as a POST form submit (SSR-only mutations). */
  bookmarkFormAction?: string;
  /** Hidden `returnTo` field for the bookmark form. */
  bookmarkReturnTo?: string;
  /** Extra classes on the card root (e.g. `event-card--availability-visible` for Ladle). */
  className?: string;
};

const ICON_SIZE = 14;
const BOOKMARK_ICON_SIZE = 18;

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

function creditsUnitLabel(creditPrice: number, locale: CatalogLocale): string {
  if (locale === "de") {
    return creditPrice === 1 ? "Credit" : "Credits";
  }
  return creditPrice === 1 ? "credit" : "credits";
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

/** Inventory: saveThis / savedThis — Merken/Gemerkt, Save/Saved */
function saveAriaLabel(saved: boolean, locale: CatalogLocale): string {
  if (locale === "de") {
    return saved ? "Gemerkt" : "Merken";
  }
  return saved ? "Saved" : "Save";
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

function BookmarkIcon({ saved }: { saved: boolean }) {
  return (
    <Bookmark
      aria-hidden
      className="event-card__bookmark-icon"
      fill={saved ? "currentColor" : "none"}
      size={BOOKMARK_ICON_SIZE}
      strokeWidth={2.25}
    />
  );
}

export function EventCard({
  event,
  locale,
  viewer = { kind: "guest" },
  ctaHref,
  onBookmarkToggle,
  bookmarkFormAction,
  bookmarkReturnTo,
  className,
}: EventCardProps) {
  const soldOut = event.remainingCapacity <= 0;
  const ctaLabel = resolveEventCardCta(viewer, soldOut, locale);
  const isGuest = viewer.kind === "guest";
  const saved = viewer.kind === "member" ? Boolean(viewer.saved) : false;
  const useFormBookmark = Boolean(bookmarkFormAction) && !isGuest;
  const useClientBookmark = !isGuest && !useFormBookmark && Boolean(onBookmarkToggle);
  const ariaLabel = saveAriaLabel(saved, locale);

  let imageSrc = "";
  let imageSrcSet = "";
  try {
    imageSrc = buildCardImageSrc(event.imageId);
    imageSrcSet = buildCardImageSrcSet(event.imageId);
  } catch {
    imageSrc = "";
    imageSrcSet = "";
  }

  const bookmarkClassName = saved
    ? "event-card__bookmark event-card__bookmark--saved"
    : "event-card__bookmark";

  let bookmarkControl: ReactNode = null;
  if (!isGuest && useFormBookmark && bookmarkFormAction) {
    bookmarkControl = (
      <Form action={bookmarkFormAction} method="post">
        {bookmarkReturnTo ? <Input name="returnTo" type="hidden" value={bookmarkReturnTo} /> : null}
        <Button
          aria-label={ariaLabel}
          aria-pressed={saved}
          className={bookmarkClassName}
          size="sm"
          type="submit"
          variant="secondary"
        >
          <BookmarkIcon saved={saved} />
        </Button>
      </Form>
    );
  } else if (!isGuest) {
    bookmarkControl = (
      <Button
        aria-label={ariaLabel}
        aria-pressed={saved}
        className={bookmarkClassName}
        isDisabled={!useClientBookmark}
        onPress={useClientBookmark ? onBookmarkToggle : undefined}
        size="sm"
        type="button"
        variant="secondary"
      >
        <BookmarkIcon saved={saved} />
      </Button>
    );
  }

  const cardClassName = className ? `event-card ${className}` : "event-card";

  return (
    <Card className={cardClassName}>
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
        </Surface>
        <Surface className="event-card__availability" variant="transparent">
          <Paragraph size="xs">{availabilityLabel(event.remainingCapacity, locale)}</Paragraph>
          <Paragraph className="event-card__ticket-type" size="xs">
            {ticketTypeLabel(event.ticketType, locale)}
          </Paragraph>
        </Surface>
      </Card.Header>
      <Card.Content className="flex flex-col gap-2">
        <Card.Title className="event-card__title">{event.title}</Card.Title>
        <Paragraph color="muted" size="sm">
          {event.partnerName}
        </Paragraph>
        <Surface className="event-card__meta" variant="transparent">
          <Calendar aria-hidden className="event-card__meta-icon" size={ICON_SIZE} strokeWidth={2} />
          <Paragraph color="muted" size="sm">
            {formatEventDate(event.dateTime, locale)}
          </Paragraph>
        </Surface>
        <Surface className="event-card__meta" variant="transparent">
          <MapPin aria-hidden className="event-card__meta-icon" size={ICON_SIZE} strokeWidth={2} />
          <Paragraph color="muted" size="sm">
            {event.neighborhood}
          </Paragraph>
        </Surface>
      </Card.Content>
      <Card.Footer className="event-card__footer">
        <Surface className="event-card__price" variant="transparent">
          <Paragraph className="event-card__price-value">{event.creditPrice}</Paragraph>
          <Paragraph className="event-card__price-unit" color="muted" size="xs">
            {creditsUnitLabel(event.creditPrice, locale)}
          </Paragraph>
        </Surface>
        <Surface className="event-card__actions" variant="transparent">
          {bookmarkControl}
          <Link className="button button--secondary button--md" href={ctaHref ?? "#"}>
            {ctaLabel}
          </Link>
        </Surface>
      </Card.Footer>
    </Card>
  );
}
