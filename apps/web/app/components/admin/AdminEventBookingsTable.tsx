import { Link, Paragraph, Table } from "@heroui/react";
import type { EventBookingListItem } from "@unveiled/db";

import type { AdminCopy } from "../../lib/admin-content";
import { getAdminCopy } from "../../lib/admin-content";
import { formatEventDateTime } from "../../lib/admin-event-form";
import type { Locale } from "../../lib/locale";

import { AdminTableActions } from "./AdminTableActions";
import { adminBookingCancelPath, adminUserDetailPath } from "./admin-tabs";
import { memberDisplayName } from "./member-display";

type AdminEventBookingsTableProps = {
  locale: Locale;
  items: EventBookingListItem[];
};

function statusLabel(copy: AdminCopy, status: string): string {
  switch (status) {
    case "CONFIRMED":
      return copy.colConfirmed;
    case "USED":
      return copy.colUsed;
    case "CANCELLED":
      return copy.colCancelled;
    case "WAITLIST":
      return copy.colWaitlist;
    default:
      return status;
  }
}

export function AdminEventBookingsTable({ locale, items }: AdminEventBookingsTableProps) {
  const copy = getAdminCopy(locale);

  if (items.length === 0) {
    return <Paragraph color="muted">{copy.bookingsEmpty}</Paragraph>;
  }

  return (
    <Table aria-label={copy.eventBookingsTitle} className="admin-table">
      <Table.ScrollContainer>
        <Table.Content>
          <Table.Header>
            <Table.Column isRowHeader>{copy.tableName}</Table.Column>
            <Table.Column isRowHeader>{copy.statusFilterLabel}</Table.Column>
            <Table.Column isRowHeader>{copy.tableDate}</Table.Column>
            <Table.Column isRowHeader>{copy.waitlistColQty}</Table.Column>
            <Table.Column isRowHeader>{copy.colCreditsCharged}</Table.Column>
            <Table.Column isRowHeader>{copy.tableCreated}</Table.Column>
            <Table.Column className="admin-table__actions-column" isRowHeader>
              {copy.tableActions}
            </Table.Column>
          </Table.Header>
          <Table.Body>
            {items.map((item) => {
              const name = memberDisplayName(item.userProfile, item.userEmail);
              const memberHref = adminUserDetailPath(locale, item.userId);

              return (
                <Table.Row key={item.id}>
                  <Table.Cell>
                    <Link className="link" href={memberHref}>
                      {name}
                    </Link>
                    {name !== item.userEmail ? (
                      <Paragraph color="muted" size="sm">
                        {item.userEmail}
                      </Paragraph>
                    ) : null}
                  </Table.Cell>
                  <Table.Cell>{statusLabel(copy, item.status)}</Table.Cell>
                  <Table.Cell>{formatEventDateTime(item.dateTime, locale)}</Table.Cell>
                  <Table.Cell>{item.ticketsCount}</Table.Cell>
                  <Table.Cell>{item.totalCredits}</Table.Cell>
                  <Table.Cell>{formatEventDateTime(item.createdAt, locale)}</Table.Cell>
                  <Table.Cell className="admin-table__actions-cell">
                    {item.status === "CONFIRMED" ? (
                      <AdminTableActions
                        actions={[
                          {
                            href: adminBookingCancelPath(locale, item.id),
                            label: copy.cancelBookingTitle,
                            icon: "delete",
                          },
                        ]}
                      />
                    ) : (
                      <Paragraph color="muted" size="sm">
                        {copy.usersNoValue}
                      </Paragraph>
                    )}
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
