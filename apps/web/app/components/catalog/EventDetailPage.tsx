import { Card, Heading, Link, Paragraph, Surface } from "@heroui/react";
import type { Event } from "@unveiled/db";
import { buildDetailHeroSrc, buildDetailHeroSrcSet } from "@unveiled/ui";

import EventDetailCheckoutCard, {
  type CheckoutPrimaryAction,
  type CheckoutSecondaryAction,
} from "../../islands/EventDetailCheckoutCard";
import EventMap, { type EventMapMarker } from "../../islands/EventMap";
import { isEventBookable } from "../../lib/catalog-mappers";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

type EventDetailPageProps = {
  event: Event;
  locale: Locale;
  viewer?: EventDetailViewer;
  /** Close control target — Discover for guests, feed/`returnTo` for members. */
  closeHref?: string;
  defaultQty?: number;
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

function soldOutMessage(locale: Locale): string {
  return locale === "de" ? "Dieses Event ist ausverkauft." : "This event is sold out.";
}

function waitlistOfferMessage(locale: Locale): string {
  return locale === "de"
    ? "Dieses Event ist ausverkauft. Du kannst dich auf die Warteliste setzen."
    : "This event is sold out. You can join the waitlist.";
}

function waitlistGuestMessage(locale: Locale): string {
  return locale === "de"
    ? "Dieses Event ist ausverkauft. Melde dich an, um auf die Warteliste zu kommen."
    : "This event is sold out. Sign in to join the waitlist.";
}

function pastMessage(locale: Locale): string {
  return locale === "de"
    ? "Dieses Event hat bereits stattgefunden."
    : "This event has already taken place.";
}

function unlockCtaLabel(locale: Locale): string {
  return locale === "de" ? "Einloggen zum Freischalten" : "Log in to unlock";
}

function signupLabel(locale: Locale): string {
  return locale === "de" ? "Registrieren" : "Sign up";
}

function waitlistGuestCtaLabel(locale: Locale): string {
  return locale === "de" ? "Anmelden für Warteliste" : "Sign in for waitlist";
}

function waitlistJoinLabel(locale: Locale): string {
  return locale === "de" ? "Auf die Warteliste" : "Join waitlist";
}

function membershipLabel(locale: Locale): string {
  return locale === "de" ? "Mitgliedschaft" : "Membership";
}

function bookLabel(locale: Locale): string {
  return locale === "de" ? "Tickets buchen" : "Book tickets";
}

function pastDueLabel(locale: Locale): string {
  return locale === "de" ? "Zahlung aktualisieren" : "Update payment";
}

function ticketsLabel(locale: Locale): string {
  return locale === "de" ? "Tickets" : "Tickets";
}

function totalLabel(locale: Locale): string {
  return locale === "de" ? "Gesamt" : "Total";
}

function policyText(): string {
  return "Secure RSVP // No refunds";
}

function guestNotice(locale: Locale): string {
  return locale === "de"
    ? "Dieses Event ist in der Mitgliedschaft enthalten. Logge dich ein oder registriere dich, um weiterzumachen."
    : "This event is included in the membership. Log in or register to continue.";
}

function eligibleNotice(locale: Locale): string {
  return locale === "de"
    ? "Dieses Event ist in der Mitgliedschaft enthalten."
    : "This event is included in the membership.";
}

function membershipNotice(locale: Locale): string {
  return locale === "de"
    ? "Aktiviere deine Mitgliedschaft, um zu buchen."
    : "Activate your membership to book.";
}

function pastDueNotice(locale: Locale): string {
  return locale === "de"
    ? "Dein Abo ist zahlungsgestört. Aktualisiere deine Zahlung, bevor du buchst."
    : "Your subscription is past due. Update payment before booking.";
}

function closeAriaLabel(locale: Locale): string {
  return locale === "de" ? "Schließen und zurück" : "Close and go back";
}

function locationLabel(locale: Locale): string {
  return locale === "de" ? "Location" : "Location";
}

function detailsLabel(locale: Locale): string {
  return locale === "de" ? "Details" : "Details";
}

function decreaseAriaLabel(locale: Locale): string {
  return locale === "de" ? "Ticket weniger" : "Decrease tickets";
}

function increaseAriaLabel(locale: Locale): string {
  return locale === "de" ? "Ticket mehr" : "Increase tickets";
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
    type: { de: "Format", en: "Event type" },
    when: { de: "Datum", en: "Date" },
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

function resolveCheckoutActions(
  locale: Locale,
  eventId: string,
  options: {
    isPast: boolean;
    isSoldOut: boolean;
    bookable: boolean;
    viewer: EventDetailViewer;
  },
): {
  primaryAction: CheckoutPrimaryAction | null;
  secondaryAction: CheckoutSecondaryAction | null;
  noticeText: string | null;
  statusMessage: string | null;
  showTicketControls: boolean;
} {
  const { isPast, isSoldOut, bookable, viewer } = options;
  const bookPath = localizedPath(locale, `events/${eventId}/book`);
  const loginPath = localizedPath(locale, "login");
  const signupPath = localizedPath(locale, "signup");
  const waitlistPath = localizedPath(locale, `events/${eventId}/waitlist`);
  const membershipPath = localizedPath(locale, "membership");

  if (isPast) {
    return {
      primaryAction: null,
      secondaryAction: null,
      noticeText: null,
      statusMessage: pastMessage(locale),
      showTicketControls: false,
    };
  }

  if (isSoldOut && viewer.kind === "eligible") {
    return {
      primaryAction: { type: "book", bookPath: waitlistPath, label: waitlistJoinLabel(locale) },
      secondaryAction: null,
      noticeText: null,
      statusMessage: waitlistOfferMessage(locale),
      showTicketControls: true,
    };
  }

  if (isSoldOut && viewer.kind === "guest") {
    return {
      primaryAction: {
        type: "login",
        loginPath,
        returnPath: waitlistPath,
        label: waitlistGuestCtaLabel(locale),
      },
      secondaryAction: { href: signupPath, label: signupLabel(locale) },
      noticeText: null,
      statusMessage: waitlistGuestMessage(locale),
      showTicketControls: true,
    };
  }

  if (isSoldOut || !bookable) {
    return {
      primaryAction: null,
      secondaryAction: null,
      noticeText: null,
      statusMessage: soldOutMessage(locale),
      showTicketControls: false,
    };
  }

  if (viewer.kind === "eligible") {
    return {
      primaryAction: { type: "book", bookPath, label: bookLabel(locale) },
      secondaryAction: null,
      noticeText: eligibleNotice(locale),
      statusMessage: null,
      showTicketControls: true,
    };
  }

  if (viewer.kind === "past_due") {
    return {
      primaryAction: { type: "link", href: membershipPath, label: pastDueLabel(locale) },
      secondaryAction: null,
      noticeText: pastDueNotice(locale),
      statusMessage: null,
      showTicketControls: true,
    };
  }

  if (viewer.kind === "membership_required") {
    return {
      primaryAction: { type: "link", href: membershipPath, label: membershipLabel(locale) },
      secondaryAction: null,
      noticeText: membershipNotice(locale),
      statusMessage: null,
      showTicketControls: true,
    };
  }

  return {
    primaryAction: {
      type: "login",
      loginPath,
      returnPath: bookPath,
      label: unlockCtaLabel(locale),
    },
    secondaryAction: { href: signupPath, label: signupLabel(locale) },
    noticeText: guestNotice(locale),
    statusMessage: null,
    showTicketControls: true,
  };
}

export function EventDetailPage({
  event,
  locale,
  viewer = { kind: "guest" },
  closeHref,
  defaultQty = 1,
}: EventDetailPageProps) {
  const bookable = isEventBookable(event);
  const isPast = event.dateTime <= new Date();
  const isSoldOut = event.remainingCapacity <= 0 && !isPast;
  const mapMarkers = eventDetailMarkers(event, locale);
  const resolvedCloseHref = closeHref ?? localizedPath(locale, "");

  let heroSrc = "";
  let heroSrcSet = "";
  try {
    heroSrc = buildDetailHeroSrc(event.imageId);
    heroSrcSet = buildDetailHeroSrcSet(event.imageId);
  } catch {
    heroSrc = "";
    heroSrcSet = "";
  }

  const checkout = resolveCheckoutActions(locale, event.id, {
    isPast,
    isSoldOut,
    bookable,
    viewer,
  });

  const eyebrow = `${event.category} // ${event.partnerName}`;

  return (
    <Surface
      className="event-detail--checkout mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
      variant="transparent"
    >
      <Surface
        className="event-detail--checkout__chrome mb-6 flex justify-end"
        variant="transparent"
      >
        <Link
          aria-label={closeAriaLabel(locale)}
          className="event-detail--checkout__close"
          href={resolvedCloseHref}
        >
          ×
        </Link>
      </Surface>

      <Surface
        className="event-detail--checkout__layout grid gap-8 lg:grid-cols-2 lg:items-start"
        variant="transparent"
      >
        <Surface
          className="event-detail--checkout__identity flex flex-col gap-5"
          variant="transparent"
        >
          <Paragraph className="event-detail--checkout__eyebrow">{eyebrow}</Paragraph>
          <Heading className="event-detail--checkout__title" level={1}>
            {event.title}
          </Heading>
          <Paragraph className="event-detail--checkout__description">{event.description}</Paragraph>
          <Surface className="event-detail--checkout__rule" variant="transparent">
            <Paragraph className="sr-only">—</Paragraph>
          </Surface>
          <Surface className="flex flex-col gap-1" variant="transparent">
            <Paragraph className="event-detail--checkout__location-label">
              {locationLabel(locale)}
            </Paragraph>
            <Paragraph className="event-detail--checkout__location-address">
              {event.address}
            </Paragraph>
          </Surface>
          {heroSrc ? (
            <Surface className="event-detail--checkout__hero" variant="transparent">
              <img
                alt={event.title}
                className="event-detail--checkout__hero-image"
                decoding="async"
                sizes="(max-width: 1024px) 100vw, 50vw"
                src={heroSrc}
                srcSet={heroSrcSet}
              />
            </Surface>
          ) : null}
        </Surface>

        <EventDetailCheckoutCard
          decreaseAriaLabel={decreaseAriaLabel(locale)}
          defaultQty={defaultQty}
          increaseAriaLabel={increaseAriaLabel(locale)}
          locale={locale}
          creditPrice={event.creditPrice}
          noticeText={checkout.noticeText}
          policyText={policyText()}
          primaryAction={checkout.primaryAction}
          secondaryAction={checkout.secondaryAction}
          showTicketControls={checkout.showTicketControls}
          statusMessage={checkout.statusMessage}
          ticketsLabel={ticketsLabel(locale)}
          totalLabel={totalLabel(locale)}
        />
      </Surface>

      <Surface
        className="event-detail--checkout__below mt-12 flex flex-col gap-6"
        variant="transparent"
      >
        <Card>
          <Card.Header>
            <Card.Title>{detailsLabel(locale)}</Card.Title>
          </Card.Header>
          <Card.Content className="flex flex-col gap-4">
            <Surface className="flex flex-col gap-1" variant="transparent">
              <Paragraph className="font-semibold uppercase" size="sm">
                {metadataLabel("when", locale)}
              </Paragraph>
              <Paragraph color="muted" size="sm">
                {formatEventDateTime(event.dateTime, locale)}
              </Paragraph>
            </Surface>
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
            {event.neighborhood ? (
              <Surface className="flex flex-col gap-1" variant="transparent">
                <Paragraph className="font-semibold uppercase" size="sm">
                  {locale === "de" ? "Kiez" : "Neighborhood"}
                </Paragraph>
                <Paragraph color="muted" size="sm">
                  {event.neighborhood}
                </Paragraph>
              </Surface>
            ) : null}
          </Card.Content>
        </Card>

        {mapMarkers.length > 0 ? (
          <Card>
            <Card.Header>
              <Card.Title>{locationLabel(locale)}</Card.Title>
            </Card.Header>
            <Card.Content className="flex flex-col gap-4">
              <Paragraph>{event.address}</Paragraph>
              <EventMap locale={locale} markers={mapMarkers} />
            </Card.Content>
          </Card>
        ) : null}
      </Surface>
    </Surface>
  );
}
