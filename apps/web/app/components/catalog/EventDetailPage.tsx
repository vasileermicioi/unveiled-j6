import { Card, Heading, Link, Paragraph, Surface } from "@heroui/react";
import {
  type Event,
  getEventCategoryLabel,
  getEventTypeLabel,
  isOccurrenceUpcoming,
  type OpeningHoursWeek,
  resolveEventCopy,
} from "@unveiled/db";
import { buildDetailHeroSrc, buildDetailHeroSrcSet } from "@unveiled/ui";
import { Calendar } from "lucide-react";

import EventDetailCheckoutCard, {
  type CheckoutPrimaryAction,
  type CheckoutSecondaryAction,
} from "../../islands/EventDetailCheckoutCard";
import EventGallerySlider from "../../islands/EventGallerySlider";
import EventMap, { type EventMapMarker } from "../../islands/EventMap";
import { alreadyBookedTicketsPath, getAlreadyBookedCopy } from "../../lib/booking-content";
import { isEventBookable } from "../../lib/catalog-mappers";
import type { CheckoutOccurrence } from "../../lib/checkout-slot";
import { getEventDetailGalleryCopy } from "../../lib/event-detail-gallery-copy";
import {
  formatEventDateTime,
  formatEventDetailWhenLines,
} from "../../lib/event-detail-when-display";
import { imageAltWithCredit, imageCreditTitle } from "../../lib/image-credit";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";
import { formatPartnerOpeningHoursLines } from "../../lib/partner-opening-hours-display";
import type { PublicEventGalleryImage } from "../../lib/public-event-gallery";
import { ImageCreditNote } from "../ImageCreditNote";
import MarkdownContent from "../MarkdownContent";

const META_ICON_SIZE = 14;

export type EventDetailPartnerAttribution = {
  name: string;
  /** Public logo variant URL; omit or empty → name-only strip (no broken img). */
  logoUrl?: string;
  /** When true with a valid week, DETAILS lists working-day hours under name/logo. */
  hasOpeningHours?: boolean;
  openingHours?: OpeningHoursWeek | null;
  /** Venue accessibility; DETAILS Accessibility row. `null` → Not specified. */
  barrierFree?: boolean | null;
  /** Partner logo credit; thumbnail `alt`/`title` when non-empty. */
  logoCredit?: string | null;
};

type EventDetailPageProps = {
  event: Event;
  locale: Locale;
  viewer?: EventDetailViewer;
  /** Close control target — Discover for guests, feed/`returnTo` for members. */
  closeHref?: string;
  /** Inclusive qty max (0 or 1) for whether the selected slot is bookable. */
  maxQty?: number;
  /** Future priced slots for eligible members; omit for guests. */
  occurrences?: CheckoutOccurrence[];
  defaultDateTimeIso?: string;
  /** Active booked occurrence ISOs (eligible members only). */
  bookedOccurrenceIsos?: string[];
  /** Ordered gallery images; omit or empty → no gallery section. */
  galleryImages?: PublicEventGalleryImage[];
  /** Caption footer + hero `alt`/`title` when `images.credit` is non-empty. */
  heroCredit?: string | null;
  /** Hosting partner name + optional logo for DETAILS-card attribution. */
  partnerAttribution?: EventDetailPartnerAttribution;
  /**
   * Admin preview: replace book/login/waitlist CTAs with an inert link.
   * Guest vs eligible chrome still follows `viewer`. Omit on public detail.
   */
  preview?: { primaryHref: string; primaryLabel: string };
};

export type EventDetailViewer =
  | { kind: "guest" }
  | { kind: "eligible" }
  | { kind: "membership_required" }
  | { kind: "past_due" };

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

function datetimeLabel(locale: Locale, allDay: boolean): string {
  if (allDay) {
    return locale === "de" ? "Datum" : "Date";
  }
  return locale === "de" ? "Datum und Uhrzeit" : "Date and time";
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

function parseCoord(value: string | null | undefined): number | null {
  if (value == null || value.trim() === "") {
    return null;
  }
  const n = Number.parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

function eventDetailMarkers(event: Event, locale: Locale, title: string): EventMapMarker[] {
  const lat = parseCoord(event.lat);
  const lng = parseCoord(event.lng);
  if (lat == null || lng == null) {
    return [];
  }

  return [
    {
      id: event.id,
      title,
      partnerName: event.partnerName,
      address: event.address,
      dateTimeLabel: formatEventDateTime(event.dateTime, locale),
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
    languageIndependent: { de: "Sprache", en: "Language" },
    subtitles: { de: "Untertitel", en: "Subtitles" },
    type: { de: "Format", en: "Event type" },
    when: { de: "Datum", en: "Date" },
    partner: { de: "Partner", en: "Partner" },
  };

  return labels[key]?.[locale] ?? key;
}

function languageIndependentValue(locale: Locale): string {
  return locale === "de" ? "Sprachunabhängig" : "Language-independent";
}

function MetaCell({ label, value, icon }: { label: string; value: string; icon?: "calendar" }) {
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

function DateTimesMetaCell({
  label,
  dateTimes,
  nextDateTime,
  locale,
  includeTime,
}: {
  label: string;
  dateTimes: Date[];
  nextDateTime: Date;
  locale: Locale;
  includeTime: boolean;
}) {
  const lines = formatEventDetailWhenLines(dateTimes, nextDateTime, locale, { includeTime });

  return (
    <Surface className="event-detail--checkout__meta-cell" variant="transparent">
      <Surface className="event-detail--checkout__meta-label-row" variant="transparent">
        <Calendar
          aria-hidden
          className="event-detail--checkout__meta-icon"
          size={META_ICON_SIZE}
          strokeWidth={2}
        />
        <Paragraph className="event-detail--checkout__meta-label" size="sm">
          {label}
        </Paragraph>
      </Surface>
      <Surface className="event-detail--checkout__meta-datetimes" variant="transparent">
        {lines.map((line) => (
          <Paragraph
            className={
              line.isNext
                ? "event-detail--checkout__meta-value event-detail--checkout__meta-value--next"
                : "event-detail--checkout__meta-value"
            }
            color={line.isNext ? undefined : "muted"}
            key={line.key}
            size="sm"
          >
            {line.label}
          </Paragraph>
        ))}
      </Surface>
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
    // Past status copy only for booking-eligible members. Guests and inactive /
    // past-due viewers get the same unlock/subscribe CTAs as for upcoming events.
    if (viewer.kind === "eligible") {
      return {
        primaryAction: {
          type: "link",
          href: localizedPath(locale, "events"),
          label: browseEventsLabel(locale),
        },
        secondaryAction: null,
        noticeText: null,
        statusMessage: pastMessage(locale),
        showTicketControls: false,
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

  // Inactive / past-due: keep subscribe CTAs (no bare sold-out dead-end).
  if (isSoldOut && viewer.kind === "past_due") {
    return {
      primaryAction: { type: "link", href: membershipPath, label: pastDueLabel(locale) },
      secondaryAction: null,
      noticeText: pastDueNotice(locale),
      statusMessage: null,
      showTicketControls: false,
    };
  }

  if (isSoldOut && viewer.kind === "membership_required") {
    return {
      primaryAction: { type: "link", href: membershipPath, label: membershipLabel(locale) },
      secondaryAction: null,
      noticeText: membershipNotice(locale),
      statusMessage: null,
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
  maxQty: _maxQty = 1,
  occurrences,
  defaultDateTimeIso,
  bookedOccurrenceIsos,
  galleryImages = [],
  heroCredit = null,
  partnerAttribution,
  preview,
}: EventDetailPageProps) {
  const eventCopy = resolveEventCopy(event, locale);
  const bookable = isEventBookable(event);
  const isPast = !isOccurrenceUpcoming(event.dateTime, new Date(), event.timingMode);
  const isSoldOut = event.remainingCapacity <= 0 && !isPast;
  const mapMarkers = eventDetailMarkers(event, locale, eventCopy.title);
  const resolvedCloseHref = closeHref ?? localizedPath(locale, "");
  const galleryCopy = getEventDetailGalleryCopy(locale);
  const partnerName = partnerAttribution?.name ?? event.partnerName;
  const partnerLogoUrl = partnerAttribution?.logoUrl?.trim() || undefined;
  const partnerHoursLines = formatPartnerOpeningHoursLines(
    Boolean(partnerAttribution?.hasOpeningHours),
    partnerAttribution?.openingHours,
    locale,
  );

  let heroSrc = "";
  let heroSrcSet = "";
  try {
    heroSrc = buildDetailHeroSrc(event.imageId);
    heroSrcSet = buildDetailHeroSrcSet(event.imageId);
  } catch {
    heroSrc = "";
    heroSrcSet = "";
  }

  const resolvedCheckout = resolveCheckoutActions(locale, event.id, {
    isPast,
    isSoldOut,
    bookable,
    viewer,
  });
  const checkout = preview
    ? {
        ...resolvedCheckout,
        primaryAction: {
          type: "link" as const,
          href: preview.primaryHref,
          label: preview.primaryLabel,
        },
        secondaryAction: null,
      }
    : resolvedCheckout;
  const showMemberBookingChrome = viewer.kind === "eligible";
  const alreadyBooked = getAlreadyBookedCopy(locale);
  const bookedIsos = preview ? undefined : bookedOccurrenceIsos;

  return (
    <Surface
      className="event-detail--checkout mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
      variant="transparent"
    >
      <Surface
        className="event-detail--checkout__layout relative flex flex-col gap-8 pt-11 lg:gap-10"
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
          className="event-detail--checkout__row-identity grid gap-8 lg:grid-cols-2 lg:items-start lg:gap-10"
          variant="transparent"
        >
          <Surface
            className="event-detail--checkout__identity flex min-w-0 flex-col gap-5"
            variant="transparent"
          >
            <Paragraph className="event-detail--checkout__eyebrow">
              {getEventCategoryLabel(locale, event.category)}
            </Paragraph>
            <Heading className="event-detail--checkout__title" level={1}>
              {eventCopy.title}
            </Heading>
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
              alreadyBookedMessage={preview ? undefined : alreadyBooked.message}
              bookedOccurrenceIsos={bookedIsos}
              datetimeLabel={datetimeLabel(locale, event.timingMode === "ALL_DAY")}
              defaultDateTimeIso={defaultDateTimeIso}
              includeTime={event.timingMode !== "ALL_DAY"}
              locale={locale}
              creditPrice={occurrences?.[0]?.creditPrice ?? event.creditPrice}
              myTicketsHref={preview ? undefined : alreadyBookedTicketsPath(locale)}
              myTicketsLabel={preview ? undefined : alreadyBooked.myTicketsLabel}
              noticeText={checkout.noticeText}
              occurrences={showMemberBookingChrome ? occurrences : undefined}
              policyText={policyText()}
              primaryAction={checkout.primaryAction}
              secondaryAction={checkout.secondaryAction}
              showCreditTotal={showMemberBookingChrome}
              showTicketControls={checkout.showTicketControls}
              statusMessage={checkout.statusMessage}
              totalLabel={totalLabel(locale)}
            />
          </Surface>
        </Surface>

        <Surface
          className="event-detail--checkout__row-media flex flex-col gap-8"
          variant="transparent"
        >
          {heroSrc ? (
            <Surface className="event-detail--checkout__hero min-w-0 w-full" variant="transparent">
              <Surface className="image-credit-photo" variant="transparent">
                <img
                  alt={imageAltWithCredit(eventCopy.title, heroCredit)}
                  className="event-detail--checkout__hero-image"
                  decoding="async"
                  sizes="(max-width: 1023px) 100vw, 1280px"
                  src={heroSrc}
                  srcSet={heroSrcSet}
                  title={imageCreditTitle(heroCredit)}
                />
                <ImageCreditNote
                  className="event-detail--checkout__hero-credit"
                  credit={heroCredit}
                />
              </Surface>
            </Surface>
          ) : null}
          <Surface
            className="event-detail--checkout__description-col min-w-0"
            variant="transparent"
          >
            <MarkdownContent
              className="event-detail--checkout__description"
              markdown={eventCopy.description}
            />
          </Surface>
        </Surface>
      </Surface>

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
              className={
                partnerName
                  ? "event-detail--checkout__meta event-detail--checkout__meta--with-partner flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:items-start lg:gap-x-8 lg:gap-y-6"
                  : "event-detail--checkout__meta flex flex-col gap-6"
              }
              variant="transparent"
            >
              {partnerName ? (
                <Surface className="event-detail--checkout__partner min-w-0" variant="transparent">
                  <Paragraph className="event-detail--checkout__meta-label" size="sm">
                    {metadataLabel("partner", locale)}
                  </Paragraph>
                  <Surface className="event-detail--checkout__partner-body" variant="transparent">
                    {partnerLogoUrl ? (
                      <Surface
                        className="event-detail--checkout__partner-logo-wrap"
                        variant="transparent"
                      >
                        <img
                          alt={imageAltWithCredit(partnerName, partnerAttribution?.logoCredit)}
                          className="event-detail--checkout__partner-logo"
                          decoding="async"
                          src={partnerLogoUrl}
                          title={imageCreditTitle(partnerAttribution?.logoCredit)}
                        />
                      </Surface>
                    ) : null}
                    <Paragraph className="event-detail--checkout__partner-name">
                      {partnerName}
                    </Paragraph>
                  </Surface>
                  {partnerHoursLines ? (
                    <Surface
                      className="event-detail--checkout__partner-hours"
                      variant="transparent"
                    >
                      {partnerHoursLines.map((line) => (
                        <Paragraph
                          className="event-detail--checkout__partner-hours-row"
                          key={line.dayKey}
                          size="sm"
                        >
                          {`${line.dayLabel}: ${line.hoursLabel}`}
                        </Paragraph>
                      ))}
                    </Surface>
                  ) : null}
                </Surface>
              ) : null}
              <Surface className="event-detail--checkout__meta-grid min-w-0" variant="transparent">
                {showMemberBookingChrome ? (
                  <DateTimesMetaCell
                    dateTimes={event.dateTimes}
                    includeTime={event.timingMode !== "ALL_DAY" && partnerHoursLines == null}
                    label={metadataLabel("when", locale)}
                    locale={locale}
                    nextDateTime={event.dateTime}
                  />
                ) : null}
                <MetaCell
                  label={metadataLabel("accessibility", locale)}
                  value={accessibilityValue(partnerAttribution?.barrierFree ?? null, locale)}
                />
                {event.languageIndependent ? (
                  <MetaCell
                    label={metadataLabel("languageIndependent", locale)}
                    value={languageIndependentValue(locale)}
                  />
                ) : event.languages && event.languages.length > 0 ? (
                  <MetaCell
                    label={metadataLabel("languages", locale)}
                    value={event.languages.join(", ")}
                  />
                ) : null}
                {event.hasSubtitles &&
                event.subtitleLanguages &&
                event.subtitleLanguages.length > 0 ? (
                  <MetaCell
                    label={metadataLabel("subtitles", locale)}
                    value={event.subtitleLanguages.join(", ")}
                  />
                ) : null}
                <MetaCell
                  label={metadataLabel("type", locale)}
                  value={getEventTypeLabel(locale, event.eventType)}
                />
              </Surface>
            </Surface>
          </Card.Content>
        </Card>

        {event.address?.trim() ? (
          <Card>
            <Card.Header>
              <Card.Title>{locationLabel(locale)}</Card.Title>
            </Card.Header>
            <Card.Content className="event-detail--checkout__location flex flex-col gap-3">
              <Paragraph className="event-detail--checkout__location-address-block">
                {event.address}
              </Paragraph>
              {mapMarkers.length > 0 ? (
                <Surface
                  className="event-detail--checkout__location-map w-full"
                  variant="transparent"
                >
                  <EventMap locale={locale} markers={mapMarkers} />
                </Surface>
              ) : null}
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
