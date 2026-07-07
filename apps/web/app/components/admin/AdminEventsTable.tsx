"use client";

import { Paragraph, Surface, Table } from "@heroui/react";
import type { Event } from "@unveiled/db";

import { getAdminCopy } from "../../lib/admin-content";
import { formatEventDateTime } from "../../lib/admin-route";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

import { AdminTableActions } from "./AdminTableActions";

type AdminEventsTableProps = {
  locale: Locale;
  events: Event[];
  imageUrls: Record<string, string | undefined>;
};

export function AdminEventsTable({ locale, events, imageUrls }: AdminEventsTableProps) {
  const copy = getAdminCopy(locale);

  if (events.length === 0) {
    return <Paragraph color="muted">{copy.emptyEvents}</Paragraph>;
  }

  return (
    <Table aria-label={copy.eventsTitle} className="admin-table">
      <Table.ScrollContainer>
        <Table.Content>
          <Table.Header>
            <Table.Column isRowHeader>{copy.tableLogo}</Table.Column>
            <Table.Column isRowHeader>{copy.tableTitle}</Table.Column>
            <Table.Column isRowHeader>{copy.tablePartner}</Table.Column>
            <Table.Column isRowHeader>{copy.tableDate}</Table.Column>
            <Table.Column isRowHeader>{copy.tableCapacity}</Table.Column>
            <Table.Column className="admin-table__actions-column" isRowHeader>
              {copy.tableActions}
            </Table.Column>
          </Table.Header>
          <Table.Body>
            {events.map((event) => (
              <Table.Row key={event.id}>
                <Table.Cell>
                  {imageUrls[event.id] ? (
                    <Surface className="admin-table__logo" variant="transparent">
                      <img alt="" src={imageUrls[event.id]} />
                    </Surface>
                  ) : (
                    <Surface
                      aria-hidden
                      className="admin-table__logo admin-table__logo--placeholder"
                      variant="transparent"
                    >
                      <Paragraph color="muted" size="sm">
                        {copy.imagePlaceholderLabel}
                      </Paragraph>
                    </Surface>
                  )}
                </Table.Cell>
                <Table.Cell>{event.title}</Table.Cell>
                <Table.Cell>{event.partnerName}</Table.Cell>
                <Table.Cell>{formatEventDateTime(event.dateTime, locale)}</Table.Cell>
                <Table.Cell>
                  {event.remainingCapacity}/{event.totalCapacity}
                </Table.Cell>
                <Table.Cell className="admin-table__actions-cell">
                  <AdminTableActions
                    actions={[
                      {
                        href: localizedPath(locale, `admin/events/${event.id}/edit`),
                        label: copy.editAction,
                        icon: "edit",
                      },
                      {
                        href: localizedPath(locale, `admin/events/${event.id}/delete`),
                        label: copy.deleteAction,
                        icon: "delete",
                      },
                      {
                        href: localizedPath(locale, `admin/events/${event.id}/codes`),
                        label: copy.exportCodesAction,
                        icon: "download",
                      },
                    ]}
                  />
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
