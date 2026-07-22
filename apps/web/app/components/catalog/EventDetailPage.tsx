import { Card, Heading, Link, Paragraph, Surface } from "@heroui/react";
import type { Event } from "@unveiled/db";
import { buildDetailHeroSrc, buildDetailHeroSrcSet } from "@unveiled/ui";
import { Calendar, MapPin } from "lucide-react";

import EventDetailCheckoutCard, {
  type CheckoutPrimaryAction,
  type CheckoutSecondaryAction,
} from "../../islands/EventDetailCheckoutCard";
import EventGallerySlider from "../../islands/EventGallerySlider";
import EventMap, { type EventMapMarker } from "../../islands/EventMap";
import { isEventBookable } from "../../lib/catalog-mappers";
import { getEventDetailGalleryCopy } from "../../lib/event-detail-gallery-copy";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";
import type { PublicEventGalleryImage } from "../../lib/public-event-gallery";

const META_ICON_SIZE = 14;

type EventDetailPageProps = {
  event: Event;
  locale: Locale;
  viewer?: EventDetailViewer;
  /** Close control target — Discover for guests, feed/`returnTo` for members. */
  closeHref?: string;
  defaultQty?: number;
  /** Inclusive qty max for checkout controls (eligible members: credits ∩ capacity). */
  maxQty?: number;
  /** Ordered gallery images; omit or empty → no gallery section. */
  galleryImages?: PublicEventGalleryImage[];
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

function browseEventsLabel(locale: Locale): string {
  return locale === "de" ? "Mehr Events" : "Browse events";
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
    neighborhood: { de: "Kiez", en: "Neighborhood" },
  };

  return labels[key]?.[locale] ?? key;
}

function MetaCell({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: "calendar" | "mapPin";
}) {
  return (
    <Surface className="event-detail--checkout__meta-cell" variant="transparent">
      <Surface className="event-detail--checkout__meta-label-row" variant="transparent">
        {icon === "calendar" ? (
          <Calendar
            aria-hidden
            className="event-detail--checkout__meta-icon"
            size={META_ICON_SIZE}
            strokeWidth={2}
          />
        ) : null}
        {icon === "mapPin" ? (
          <MapPin
            aria-hidden
            className="event-detail--checkout__meta-icon"
            size={META_ICON_SIZE}
            strokeWidth={2}
          />
        ) : null}
        <Paragraph className="event-detail--checkout__meta-label" size="sm">
          {label}
        </Paragraph>
      </Surface>
      <Paragraph className="event-detail--checkout__meta-value" color="muted" size="sm">
        {value}
      </Paragraph>
    </Surface>
  );
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
    // Guests: identical checkout to upcoming (same copy/CTAs). Signed-in: past status.
    if (viewer.kind === "guest") {
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
        showTicketControls: false,
      };
    }

    const browseHref =
      viewer.kind === "eligible" ? localizedPath(locale, "events") : localizedPath(locale, "");
    return {
      primaryAction: { type: "link", href: browseHref, label: browseEventsLabel(locale) },
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
      showTicketControls: false,
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
      showTicketControls: false,
    };
  }

  if (viewer.kind === "membership_required") {
    return {
      primaryAction: { type: "link", href: membershipPath, label: membershipLabel(locale) },
      secondaryAction: null,
      noticeText: membershipNotice(locale),
      statusMessage: null,
      showTicketControls: false,
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
    showTicketControls: false,
  };
}

export function EventDetailPage({
  event,
  locale,
  viewer = { kind: "guest" },
  closeHref,
  defaultQty = 1,
  maxQty = 3,
  galleryImages = [],
}: EventDetailPageProps) {
  const bookable = isEventBookable(event);
  const isPast = event.dateTime <= new Date();
  const isSoldOut = event.remainingCapacity <= 0 && !isPast;
  const mapMarkers = eventDetailMarkers(event, locale);
  const resolvedCloseHref = closeHref ?? localizedPath(locale, "");
  const galleryCopy = getEventDetailGalleryCopy(locale);

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
  const showMemberBookingChrome = viewer.kind === "eligible";

  const eyebrow = `${event.category} // ${event.partnerName}`;

  return (
    <Surface
      className="event-detail--checkout mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
      variant="transparent"
    >
      <Surface
        className="event-detail--checkout__layout relative grid gap-8 pt-11 lg:grid-cols-2 lg:items-start lg:gap-10"
        variant="transparent"
      >
        <Link
          aria-label={closeAriaLabel(locale)}
          className="event-detail--checkout__close absolute top-0 right-0 z-10"
          href={resolvedCloseHref}
        >
          ×
        </Link>

        <Surface
          className="event-detail--checkout__identity flex min-w-0 flex-col gap-5"
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
        </Surface>

        <Surface className="event-detail--checkout__checkout min-w-0" variant="transparent">
          <EventDetailCheckoutCard
            decreaseAriaLabel={decreaseAriaLabel(locale)}
            defaultQty={defaultQty}
            increaseAriaLabel={increaseAriaLabel(locale)}
            locale={locale}
            creditPrice={event.creditPrice}
            maxQty={maxQty}
            noticeText={checkout.noticeText}
            policyText={policyText()}
            primaryAction={checkout.primaryAction}
            secondaryAction={checkout.secondaryAction}
            showCreditTotal={showMemberBookingChrome}
            showTicketControls={checkout.showTicketControls}
            statusMessage={checkout.statusMessage}
            ticketsLabel={ticketsLabel(locale)}
            totalLabel={totalLabel(locale)}
          />
        </Surface>
      </Surface>

      {heroSrc ? (
        <Surface className="event-detail--checkout__hero mt-10 w-full" variant="transparent">
          <img
            alt={event.title}
            className="event-detail--checkout__hero-image"
            decoding="async"
            sizes="(max-width: 1280px) 100vw, 1280px"
            src={heroSrc}
            srcSet={heroSrcSet}
          />
        </Surface>
      ) : null}

      <Surface
        className="event-detail--checkout__below mt-12 flex flex-col gap-6"
        variant="transparent"
      >
        <Card>
          <Card.Header>
            <Card.Title>{detailsLabel(locale)}</Card.Title>
          </Card.Header>
          <Card.Content>
            <Surface
              className="event-detail--checkout__meta-grid grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3"
              variant="transparent"
            >
              {showMemberBookingChrome ? (
                <MetaCell
                  icon="calendar"
                  label={metadataLabel("when", locale)}
                  value={formatEventDateTime(event.dateTime, locale)}
                />
              ) : null}
              <MetaCell
                label={metadataLabel("accessibility", locale)}
                value={accessibilityValue(event.barrierFree, locale)}
              />
              {event.languages && event.languages.length > 0 ? (
                <MetaCell
                  label={metadataLabel("languages", locale)}
                  value={event.languages.join(", ")}
                />
              ) : null}
              {event.targetAgeGroups && event.targetAgeGroups.length > 0 ? (
                <MetaCell
                  label={metadataLabel("ageGroups", locale)}
                  value={event.targetAgeGroups.join(", ")}
                />
              ) : null}
              <MetaCell label={metadataLabel("type", locale)} value={event.eventType} />
              {event.neighborhood ? (
                <MetaCell
                  icon="mapPin"
                  label={metadataLabel("neighborhood", locale)}
                  value={event.neighborhood}
                />
              ) : null}
            </Surface>
          </Card.Content>
        </Card>

        {mapMarkers.length > 0 ? (
          <Card>
            <Card.Header>
              <Card.Title>{locationLabel(locale)}</Card.Title>
            </Card.Header>
            <Card.Content className="event-detail--checkout__location flex flex-col gap-3">
              <Paragraph className="event-detail--checkout__location-address-block">
                {event.address}
              </Paragraph>
              <Surface
                className="event-detail--checkout__location-map w-full"
                variant="transparent"
              >
                <EventMap locale={locale} markers={mapMarkers} />
              </Surface>
            </Card.Content>
          </Card>
        ) : null}
      </Surface>

      {galleryImages.length > 0 ? (
        <Card className="event-detail-gallery mt-12">
          <Card.Header>
            <Card.Title>{galleryCopy.sectionTitle}</Card.Title>
          </Card.Header>
          <Card.Content>
            <EventGallerySlider copy={galleryCopy} images={galleryImages} />
          </Card.Content>
        </Card>
      ) : null}
    </Surface>
  );
}
