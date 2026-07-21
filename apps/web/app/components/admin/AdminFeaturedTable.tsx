"use client";

import { Paragraph, Table } from "@heroui/react";
import type { FeaturedEventRow } from "@unveiled/db";

import { getAdminCopy } from "../../lib/admin-content";
import { formatEventDateTime } from "../../lib/admin-event-form";
import type { Locale } from "../../lib/locale";

import { AdminTableActions } from "./AdminTableActions";
import { adminFeaturedRemovePath } from "./admin-tabs";

type AdminFeaturedTableProps = {
  locale: Locale;
  events: FeaturedEventRow[];
};

export function AdminFeaturedTable({ locale, events }: AdminFeaturedTableProps) {
  const copy = getAdminCopy(locale);

  if (events.length === 0) {
    return <Paragraph color="muted">{copy.featuredEmpty}</Paragraph>;
  }

  return (
    <Table aria-label={copy.featuredTitle} className="admin-table">
      <Table.ScrollContainer>
        <Table.Content>
          <Table.Header>
            <Table.Column isRowHeader>{copy.tableTitle}</Table.Column>
            <Table.Column isRowHeader>{copy.tablePartner}</Table.Column>
            <Table.Column isRowHeader>{copy.tableDate}</Table.Column>
            <Table.Column className="admin-table__actions-column" isRowHeader>
              {copy.tableActions}
            </Table.Column>
          </Table.Header>
          <Table.Body>
            {events.map((event) => (
              <Table.Row key={event.id}>
                <Table.Cell>{event.title}</Table.Cell>
                <Table.Cell>{event.partnerName}</Table.Cell>
                <Table.Cell>{formatEventDateTime(event.dateTime, locale)}</Table.Cell>
                <Table.Cell className="admin-table__actions-cell">
                  <AdminTableActions
                    actions={[
                      {
                        href: adminFeaturedRemovePath(locale, event.id),
                        label: copy.featuredRemoveAction,
                        icon: "delete",
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
