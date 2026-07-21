"use client";

import { Button, Form, Input, Paragraph, Surface, Table } from "@heroui/react";
import type { Event } from "@unveiled/db";

import { getAdminCopy } from "../../lib/admin-content";
import { formatEventDateTime } from "../../lib/admin-event-form";
import type { Locale } from "../../lib/locale";

import { adminFeaturedAddPath } from "./admin-tabs";

type AdminFeaturedAddResultsProps = {
  locale: Locale;
  events: Event[];
};

export function AdminFeaturedAddResults({ locale, events }: AdminFeaturedAddResultsProps) {
  const copy = getAdminCopy(locale);
  const action = adminFeaturedAddPath(locale);

  if (events.length === 0) {
    return <Paragraph color="muted">{copy.featuredAddEmpty}</Paragraph>;
  }

  return (
    <Table aria-label={copy.featuredAddTitle} className="admin-table">
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
                  <Surface variant="transparent">
                    <Form action={action} method="post">
                      <Input name="eventId" type="hidden" value={event.id} />
                      <Button className="button button--primary button--sm" type="submit">
                        {copy.featuredAddSubmit}
                      </Button>
                    </Form>
                  </Surface>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Content>
      </Table.ScrollContainer>
    </Table>
  );
}
