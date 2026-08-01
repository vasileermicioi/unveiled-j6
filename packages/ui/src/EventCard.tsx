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
  /** Extra classes on the card root (e.g. layout helpers in Ladle). */
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

function waitlistCtaLabel(locale: CatalogLocale): string {
  return locale === "de" ? "Warteliste" : "Waitlist";
}

function discoverCtaLabel(locale: CatalogLocale): string {
  return locale === "de" ? "Entdecken" : "Discover";
}

/** Inventory: saveThis / savedThis — Merken/Gemerkt, Save/Saved */
function saveAriaLabel(saved: boolean, locale: CatalogLocale): string {
  if (locale === "de") {
    return saved ? "Gemerkt" : "Merken";
  }
  return saved ? "Saved" : "Save";
}

export function resolveEventCardCta(
  _viewer: EventCardViewerState,
  soldOut: boolean,
  locale: CatalogLocale,
): string {
  if (soldOut) {
    return waitlistCtaLabel(locale);
  }
  return discoverCtaLabel(locale);
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
  const showSubscriberMeta = viewer.kind === "member" && viewer.subscriptionActive;
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
  const detailHref = ctaHref ?? "#";

  return (
    <Card className={cardClassName}>
      <Card.Header className="event-card__header">
        <Surface className="event-card__image" variant="transparent">
          <Link className="event-card__media-link" href={detailHref}>
            {imageSrc ? (
              <img
                alt={event.title}
                className="event-card__image-el"
                decoding="async"
                loading="lazy"
                sizes="(max-width: 640px) 100vw, 640px"
                src={imageSrc}
                srcSet={imageSrcSet}
              />
            ) : null}
          </Link>
          <Chip className="event-card__category" size="sm">
            {event.category}
          </Chip>
        </Surface>
      </Card.Header>
      <Card.Content className="event-card__body flex flex-col gap-2">
        <Link className="event-card__title-link" href={detailHref}>
          <Card.Title className="event-card__title">{event.title}</Card.Title>
        </Link>
        <Paragraph color="muted" size="sm">
          {event.partnerName}
        </Paragraph>
        {showSubscriberMeta ? (
          <Surface className="event-card__meta" variant="transparent">
            <Calendar
              aria-hidden
              className="event-card__meta-icon"
              size={ICON_SIZE}
              strokeWidth={2}
            />
            <Paragraph color="muted" size="sm">
              {formatEventDate(event.dateTime, locale)}
            </Paragraph>
          </Surface>
        ) : null}
        <Surface className="event-card__meta" variant="transparent">
          <MapPin aria-hidden className="event-card__meta-icon" size={ICON_SIZE} strokeWidth={2} />
          <Paragraph color="muted" size="sm">
            {event.zipCode}
          </Paragraph>
        </Surface>
      </Card.Content>
      <Card.Footer className="event-card__footer">
        {showSubscriberMeta ? (
          <Surface className="event-card__price" variant="transparent">
            <Paragraph className="event-card__price-value">{event.creditPrice}</Paragraph>
            <Paragraph className="event-card__price-unit" color="muted" size="xs">
              {creditsUnitLabel(event.creditPrice, locale)}
            </Paragraph>
          </Surface>
        ) : null}
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
