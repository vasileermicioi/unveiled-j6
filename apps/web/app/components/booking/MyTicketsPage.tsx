import { Card, Link, Paragraph, Surface } from "@heroui/react";
import type { UserBookingListItem } from "@unveiled/db";

import type { BookConfirmCopy } from "../../lib/booking-content";
import type { MyTicketsCopy } from "../../lib/bookings-content";
import { getCopy } from "../../lib/copy";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";
import { PageSectionHeader } from "../marketing/PageSectionHeader";
import { BookingsPagination } from "./BookingsPagination";
import { BookingTicketCard } from "./BookingTicketCard";

export type MyTicketsPageProps = {
  locale: Locale;
  items: UserBookingListItem[];
  page: number;
  total: number;
  pageSize: number;
  listCopy: MyTicketsCopy;
  confirmCopy: BookConfirmCopy;
  /** Booking-eligible members get Browse events; others get Start membership. */
  subscriptionActive?: boolean;
};

export function MyTicketsPage({
  locale,
  items,
  page,
  total,
  pageSize,
  listCopy,
  confirmCopy,
  subscriptionActive = false,
}: MyTicketsPageProps) {
  const basePath = localizedPath(locale, "bookings");

  return (
    <Surface
      className="mx-auto flex max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6 lg:px-8"
      variant="transparent"
    >
      <PageSectionHeader eyebrow={listCopy.eyebrow} headline={listCopy.title} />

      {items.length === 0 ? (
        <Card>
          <Card.Content className="flex flex-col items-start gap-4">
            <Paragraph>{listCopy.empty}</Paragraph>
            <Link
              className={
                subscriptionActive
                  ? "button button--secondary button--md"
                  : "button button--primary button--md"
              }
              href={
                subscriptionActive
                  ? localizedPath(locale, "events")
                  : localizedPath(locale, "membership")
              }
            >
              {subscriptionActive ? listCopy.browseEvents : getCopy(locale).subscribeCta}
            </Link>
          </Card.Content>
        </Card>
      ) : (
        <Surface className="flex flex-col gap-6" variant="transparent">
          {items.map(({ booking, event, tickets }) => (
            <BookingTicketCard
              booking={booking}
              confirmCopy={confirmCopy}
              event={event}
              key={booking.id}
              listCopy={listCopy}
              locale={locale}
              tickets={tickets}
            />
          ))}
        </Surface>
      )}

      <BookingsPagination
        basePath={basePath}
        copy={listCopy}
        page={page}
        pageSize={pageSize}
        total={total}
      />
    </Surface>
  );
}
