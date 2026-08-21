import { Link, Paragraph, Surface } from "@heroui/react";
import { type Booking, type BookingTicket, type Event, resolveEventCopy } from "@unveiled/db";

import type { BookConfirmCopy } from "../../lib/booking-content";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";
import { PageSectionHeader } from "../marketing/PageSectionHeader";
import { TicketRedemptionBlock } from "./TicketRedemptionBlock";

export type BookConfirmPageProps = {
  locale: Locale;
  event: Event;
  booking: Booking;
  tickets: BookingTicket[];
  copy: BookConfirmCopy;
  icsHref: string;
};

export function BookConfirmPage({
  locale,
  event,
  booking,
  tickets,
  copy,
  icsHref,
}: BookConfirmPageProps) {
  const eventHref = localizedPath(locale, `events/${event.id}`);
  const eventTitle = resolveEventCopy(event, locale).title;

  return (
    <Surface
      className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-12 sm:px-6"
      variant="transparent"
    >
      <PageSectionHeader eyebrow={copy.eyebrow} headline={copy.title} />
      <Paragraph>{copy.subtitle}</Paragraph>
      <Paragraph>{eventTitle}</Paragraph>
      <Paragraph>
        {event.partnerName} · {copy.ticketsLabel(booking.ticketsCount)}
      </Paragraph>
      <Paragraph>
        {new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "Europe/Berlin",
        }).format(booking.dateTime)}
      </Paragraph>

      <TicketRedemptionBlock booking={booking} copy={copy} locale={locale} tickets={tickets} />

      <Surface className="flex flex-col gap-3 sm:flex-row" variant="transparent">
        <Link className="button button--primary button--md" href={icsHref}>
          {copy.downloadIcs}
        </Link>
        <Link className="button button--secondary button--md" href={eventHref}>
          {copy.backToEvent}
        </Link>
      </Surface>

      <Paragraph>
        {copy.supportLabel}: <Link href={`mailto:${copy.supportEmail}`}>{copy.supportEmail}</Link>
      </Paragraph>
    </Surface>
  );
}
