import { Heading, Link, Paragraph, Surface } from "@heroui/react";
import type { Booking, Event } from "@unveiled/db";

import type { BookConfirmCopy } from "../../lib/booking-content";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";
import { TicketRedemptionBlock } from "./TicketRedemptionBlock";

export type BookConfirmPageProps = {
  locale: Locale;
  event: Event;
  booking: Booking;
  copy: BookConfirmCopy;
  icsHref: string;
};

export function BookConfirmPage({ locale, event, booking, copy, icsHref }: BookConfirmPageProps) {
  const eventHref = localizedPath(locale, `events/${event.id}`);

  return (
    <Surface
      className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-12 sm:px-6"
      variant="transparent"
    >
      <Heading level={1}>{copy.title}</Heading>
      <Paragraph>{copy.subtitle}</Paragraph>
      <Paragraph>{event.title}</Paragraph>
      <Paragraph>
        {event.partnerName} · {copy.ticketsLabel(booking.ticketsCount)}
      </Paragraph>

      <TicketRedemptionBlock booking={booking} copy={copy} />

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
