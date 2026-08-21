import { Card, Chip, Heading, Link, Paragraph, Surface } from "@heroui/react";
import {
  type Booking,
  type BookingStatus,
  type BookingTicket,
  resolveEventCopy,
  type UserBookingEventSummary,
} from "@unveiled/db";

import type { BookConfirmCopy } from "../../lib/booking-content";
import type { MyTicketsCopy } from "../../lib/bookings-content";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";
import { TicketRedemptionBlockCompact } from "./TicketRedemptionBlock";

export type BookingTicketCardProps = {
  locale: Locale;
  booking: Booking;
  event: UserBookingEventSummary;
  tickets: BookingTicket[];
  confirmCopy: Pick<
    BookConfirmCopy,
    | "ticketCodeLabel"
    | "voucherLabel"
    | "pdfVoucherLabel"
    | "secretDesc"
    | "copy"
    | "copied"
    | "showCode"
    | "hideCode"
    | "downloadPdf"
    | "openVoucher"
    | "ticketsLabel"
    | "ticketOrdinalLabel"
  >;
  listCopy: Pick<
    MyTicketsCopy,
    "viewTicket" | "statusConfirmed" | "statusCancelled" | "statusUsed" | "statusWaitlist"
  >;
};

function formatEventDateTime(dateTime: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Berlin",
  }).format(dateTime);
}

function statusLabel(status: BookingStatus, copy: BookingTicketCardProps["listCopy"]): string {
  switch (status) {
    case "CONFIRMED":
      return copy.statusConfirmed;
    case "CANCELLED":
      return copy.statusCancelled;
    case "USED":
      return copy.statusUsed;
    case "WAITLIST":
      return copy.statusWaitlist;
    default:
      return status;
  }
}

export function BookingTicketCard({
  locale,
  booking,
  event,
  tickets,
  confirmCopy,
  listCopy,
}: BookingTicketCardProps) {
  const confirmHref = localizedPath(
    locale,
    `events/${event.id}/book/confirm?booking=${encodeURIComponent(booking.id)}`,
  );
  const eventTitle = resolveEventCopy(
    {
      title: event.title,
      description: "",
      titleDe: event.titleDe,
      titleEn: event.titleEn,
    },
    locale,
  ).title;

  return (
    <Card>
      <Card.Header className="flex flex-col items-start gap-2">
        <Surface
          className="flex w-full flex-wrap items-center justify-between gap-2"
          variant="transparent"
        >
          <Heading level={3}>{eventTitle}</Heading>
          {booking.status !== "CONFIRMED" ? (
            <Chip size="sm" variant="tertiary">
              <Chip.Label>{statusLabel(booking.status, listCopy)}</Chip.Label>
            </Chip>
          ) : null}
        </Surface>
        <Paragraph color="muted" size="sm">
          {event.partnerName} · {formatEventDateTime(booking.dateTime, locale)}
        </Paragraph>
        <Paragraph size="sm">{confirmCopy.ticketsLabel(booking.ticketsCount)}</Paragraph>
      </Card.Header>
      <Card.Content className="flex flex-col gap-4">
        <TicketRedemptionBlockCompact
          booking={booking}
          copy={confirmCopy}
          locale={locale}
          tickets={tickets}
        />
        <Link className="button button--primary button--md" href={confirmHref}>
          {listCopy.viewTicket}
        </Link>
      </Card.Content>
    </Card>
  );
}
