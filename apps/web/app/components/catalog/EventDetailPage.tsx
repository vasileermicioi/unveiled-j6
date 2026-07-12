import { Card, Chip, Heading, Link, Paragraph, Surface } from "@heroui/react";
import type { Event } from "@unveiled/db";
import { buildDetailHeroSrc, buildDetailHeroSrcSet } from "@unveiled/ui";

import EventMap, { type EventMapMarker } from "../../islands/EventMap";
import { isEventBookable } from "../../lib/catalog-mappers";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

type EventDetailPageProps = {
  event: Event;
  locale: Locale;
  viewer?: EventDetailViewer;
};

export type EventDetailViewer =
  | { kind: "guest" }
  | { kind: "eligible" }
  | { kind: "membership_required" }
  | { kind: "past_due" };

function formatEventDateTime(dateTime: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Berlin",
  }).format(dateTime);
}

function creditLabel(creditPrice: number, locale: Locale): string {
  if (locale === "de") {
    return `${creditPrice} Credit${creditPrice === 1 ? "" : "s"}`;
  }
  return `${creditPrice} credit${creditPrice === 1 ? "" : "s"}`;
}

function listLabel(locale: Locale): string {
  return locale === "de" ? "Details" : "Details";
}

function soldOutMessage(locale: Locale): string {
  return locale === "de" ? "Dieses Event ist ausverkauft." : "This event is sold out.";
}

function pastMessage(locale: Locale): string {
  return locale === "de"
    ? "Dieses Event hat bereits stattgefunden."
    : "This event has already taken place.";
}

function guestCtaLabel(locale: Locale): string {
  return locale === "de" ? "Anmelden zum Buchen" : "Sign in to book";
}

function membershipLabel(locale: Locale): string {
  return locale === "de" ? "Mitgliedschaft" : "Membership";
}

function bookLabel(locale: Locale): string {
  return locale === "de" ? "Tickets buchen" : "Book tickets";
}

function pastDueLabel(locale: Locale): string {
  return locale === "de" ? "Credits eingefroren" : "Credits frozen";
}

function parseCoord(value: string | null | undefined): number | null {
  if (value == null || value.trim() === "") {
    return null;
  }
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function eventDetailMarkers(event: Event, locale: Locale): EventMapMarker[] {
  const lat = parseCoord(event.lat);
  const lng = parseCoord(event.lng);
  if (lat == null || lng == null) {
    return [];
  }

  return [
    {
      id: event.id,
      title: event.title,
      partnerName: event.partnerName,
      address: event.address,
      lat,
      lng,
      href: localizedPath(locale, `events/${event.id}`),
    },
  ];
}

function metadataLabel(key: string, locale: Locale): string {
  const labels: Record<string, { de: string; en: string }> = {
    accessibility: { de: "Barrierefreiheit", en: "Accessibility" },
    languages: { de: "Sprachen", en: "Languages" },
    ageGroups: { de: "Zielgruppe", en: "Target age groups" },
    category: { de: "Kategorie", en: "Category" },
    type: { de: "Format", en: "Event type" },
  };

  return labels[key]?.[locale] ?? key;
}

function accessibilityValue(barrierFree: boolean | null, locale: Locale): string {
  if (barrierFree === true) {
    return locale === "de" ? "Barrierefrei" : "Barrier-free";
  }
  if (barrierFree === false) {
    return locale === "de" ? "Nicht barrierefrei" : "Not barrier-free";
  }
  return locale === "de" ? "Keine Angabe" : "Not specified";
}

export function EventDetailPage({
  event,
  locale,
  viewer = { kind: "guest" },
}: EventDetailPageProps) {
  const bookable = isEventBookable(event);
  const isPast = event.dateTime <= new Date();
  const isSoldOut = event.remainingCapacity <= 0 && !isPast;
  const mapMarkers = eventDetailMarkers(event, locale);

  let heroSrc = "";
  let heroSrcSet = "";
  try {
    heroSrc = buildDetailHeroSrc(event.imageId);
    heroSrcSet = buildDetailHeroSrcSet(event.imageId);
  } catch {
    heroSrc = "";
    heroSrcSet = "";
  }

  let ctaMessage: string;
  if (isPast) {
    ctaMessage = pastMessage(locale);
  } else if (isSoldOut || !bookable) {
    ctaMessage = soldOutMessage(locale);
  } else if (viewer.kind === "eligible") {
    ctaMessage =
      locale === "de"
        ? "Reserviere Tickets mit deinen Credits."
        : "Reserve tickets with your credits.";
  } else if (viewer.kind === "past_due") {
    ctaMessage =
      locale === "de"
        ? "Dein Abo ist zahlungsgestört. Aktualisiere deine Zahlung, bevor du buchst."
        : "Your subscription is past due. Update payment before booking.";
  } else if (viewer.kind === "membership_required") {
    ctaMessage =
      locale === "de"
        ? "Aktiviere deine Mitgliedschaft, um zu buchen."
        : "Activate your membership to book.";
  } else {
    ctaMessage =
      locale === "de" ? "Melde dich an, um dieses Event zu buchen." : "Sign in to book this event.";
  }

  const showBookCta = !isPast && bookable && !isSoldOut && viewer.kind === "eligible";
  const showPastDueCta = !isPast && bookable && !isSoldOut && viewer.kind === "past_due";
  const showMembershipCta =
    !isPast && bookable && !isSoldOut && viewer.kind === "membership_required";
  const showGuestCta = !isPast && bookable && !isSoldOut && viewer.kind === "guest";

  return (
    <Surface
      className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8"
      variant="transparent"
    >
      <Surface className="event-detail__hero" variant="transparent">
        {heroSrc ? (
          <img
            alt={event.title}
            className="event-detail__hero-image"
            decoding="async"
            sizes="(max-width: 640px) 100vw, (max-width: 1280px) 100vw, 1920px"
            src={heroSrc}
            srcSet={heroSrcSet}
          />
        ) : null}
      </Surface>

      <Surface className="flex flex-col gap-3" variant="transparent">
        <Chip size="sm">{event.category}</Chip>
        <Heading level={1}>{event.title}</Heading>
        <Paragraph color="muted" size="base">
          {event.partnerName}
        </Paragraph>
        <Paragraph size="base">{formatEventDateTime(event.dateTime, locale)}</Paragraph>
        <Paragraph size="base">{event.neighborhood}</Paragraph>
        <Paragraph className="font-semibold uppercase" size="base">
          {creditLabel(event.creditPrice, locale)}
        </Paragraph>
      </Surface>

      <Card>
        <Card.Header>
          <Card.Title>{listLabel(locale)}</Card.Title>
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
          <Paragraph>{event.description}</Paragraph>
          <Surface className="flex flex-col gap-1" variant="transparent">
            <Paragraph className="font-semibold uppercase" size="sm">
              {metadataLabel("accessibility", locale)}
            </Paragraph>
            <Paragraph color="muted" size="sm">
              {accessibilityValue(event.barrierFree, locale)}
            </Paragraph>
          </Surface>
          {event.languages && event.languages.length > 0 ? (
            <Surface className="flex flex-col gap-1" variant="transparent">
              <Paragraph className="font-semibold uppercase" size="sm">
                {metadataLabel("languages", locale)}
              </Paragraph>
              <Paragraph color="muted" size="sm">
                {event.languages.join(", ")}
              </Paragraph>
            </Surface>
          ) : null}
          {event.targetAgeGroups && event.targetAgeGroups.length > 0 ? (
            <Surface className="flex flex-col gap-1" variant="transparent">
              <Paragraph className="font-semibold uppercase" size="sm">
                {metadataLabel("ageGroups", locale)}
              </Paragraph>
              <Paragraph color="muted" size="sm">
                {event.targetAgeGroups.join(", ")}
              </Paragraph>
            </Surface>
          ) : null}
          <Surface className="flex flex-col gap-1" variant="transparent">
            <Paragraph className="font-semibold uppercase" size="sm">
              {metadataLabel("type", locale)}
            </Paragraph>
            <Paragraph color="muted" size="sm">
              {event.eventType}
            </Paragraph>
          </Surface>
        </Card.Content>
      </Card>

      <Card>
        <Card.Header>
          <Card.Title>{locale === "de" ? "Ort" : "Location"}</Card.Title>
        </Card.Header>
        <Card.Content className="flex flex-col gap-4">
          <Paragraph>{event.address}</Paragraph>
          {mapMarkers.length > 0 ? <EventMap locale={locale} markers={mapMarkers} /> : null}
        </Card.Content>
      </Card>

      <Card className="event-detail__cta-card">
        <Card.Content className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Paragraph>{ctaMessage}</Paragraph>
          <Surface className="flex flex-col gap-3 sm:flex-row" variant="transparent">
            {showBookCta ? (
              <Link
                className="button button--primary button--md"
                href={localizedPath(locale, `events/${event.id}/book`)}
              >
                {bookLabel(locale)}
              </Link>
            ) : null}
            {showPastDueCta ? (
              <Link
                className="button button--primary button--md"
                href={localizedPath(locale, `events/${event.id}/book`)}
              >
                {pastDueLabel(locale)}
              </Link>
            ) : null}
            {showMembershipCta ? (
              <Link
                className="button button--primary button--md"
                href={localizedPath(locale, "membership")}
              >
                {membershipLabel(locale)}
              </Link>
            ) : null}
            {showGuestCta ? (
              <>
                <Link
                  className="button button--primary button--md"
                  href={localizedPath(locale, "login")}
                >
                  {guestCtaLabel(locale)}
                </Link>
                <Link
                  className="button button--secondary button--md"
                  href={localizedPath(locale, "membership")}
                >
                  {membershipLabel(locale)}
                </Link>
              </>
            ) : null}
          </Surface>
        </Card.Content>
      </Card>
    </Surface>
  );
}
