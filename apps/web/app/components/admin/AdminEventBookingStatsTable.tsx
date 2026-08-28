import { Link, Paragraph, Table } from "@heroui/react";
import type { EventBookingStatsRow } from "@unveiled/db";

import { getAdminCopy } from "../../lib/admin-content";
import { formatEventDateTime } from "../../lib/admin-event-form";
import type { Locale } from "../../lib/locale";

import { adminEventBookingsPath } from "./admin-tabs";

type AdminEventBookingStatsTableProps = {
  locale: Locale;
  items: EventBookingStatsRow[];
};

export function AdminEventBookingStatsTable({ locale, items }: AdminEventBookingStatsTableProps) {
  const copy = getAdminCopy(locale);

  if (items.length === 0) {
    return <Paragraph color="muted">{copy.bookingsIndexEmpty}</Paragraph>;
  }

  return (
    <Table aria-label={copy.bookingsIndexTitle} className="admin-table">
      <Table.ScrollContainer>
        <Table.Content>
          <Table.Header>
            <Table.Column isRowHeader>{copy.tableTitle}</Table.Column>
            <Table.Column isRowHeader>{copy.tablePartner}</Table.Column>
            <Table.Column isRowHeader>{copy.tableDate}</Table.Column>
            <Table.Column isRowHeader>{copy.colConfirmed}</Table.Column>
            <Table.Column isRowHeader>{copy.colUsed}</Table.Column>
            <Table.Column isRowHeader>{copy.colCancelled}</Table.Column>
            <Table.Column isRowHeader>{copy.colWaitlist}</Table.Column>
            <Table.Column isRowHeader>{copy.tableCapacity}</Table.Column>
          </Table.Header>
          <Table.Body>
            {items.map((row) => {
              const localized = locale === "en" ? row.titleEn : row.titleDe;
              const title = localized.trim() || row.title;
              const href = adminEventBookingsPath(locale, row.eventId);

              return (
                <Table.Row key={row.eventId}>
                  <Table.Cell>
                    <Link className="link" href={href}>
                      {title}
                    </Link>
                  </Table.Cell>
                  <Table.Cell>{row.partnerName}</Table.Cell>
                  <Table.Cell>{formatEventDateTime(row.dateTime, locale)}</Table.Cell>
                  <Table.Cell>{row.confirmedCount}</Table.Cell>
                  <Table.Cell>{row.usedCount}</Table.Cell>
                  <Table.Cell>{row.cancelledCount}</Table.Cell>
                  <Table.Cell>{row.waitingCount}</Table.Cell>
                  <Table.Cell>
                    {row.remainingCapacity}/{row.totalCapacity}
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
