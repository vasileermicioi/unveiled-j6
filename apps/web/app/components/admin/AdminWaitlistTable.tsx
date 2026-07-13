"use client";

import { Link, Paragraph, Table } from "@heroui/react";
import type { AdminWaitlistRow } from "@unveiled/db";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

import { AdminTableActions } from "./AdminTableActions";
import { adminWaitlistPromotePath } from "./admin-tabs";

type AdminWaitlistTableProps = {
  locale: Locale;
  entries: AdminWaitlistRow[];
};

export function AdminWaitlistTable({ locale, entries }: AdminWaitlistTableProps) {
  const copy = getAdminCopy(locale);

  if (entries.length === 0) {
    return <Paragraph color="muted">{copy.waitlistEmpty}</Paragraph>;
  }

  return (
    <Table aria-label={copy.waitlistTitle} className="admin-table">
      <Table.ScrollContainer>
        <Table.Content>
          <Table.Header>
            <Table.Column isRowHeader>{copy.waitlistColUser}</Table.Column>
            <Table.Column isRowHeader>{copy.waitlistColEvent}</Table.Column>
            <Table.Column isRowHeader>{copy.waitlistColStatus}</Table.Column>
            <Table.Column isRowHeader>{copy.waitlistColQty}</Table.Column>
            <Table.Column isRowHeader>{copy.waitlistColSkipped}</Table.Column>
            <Table.Column isRowHeader>{copy.waitlistColCreated}</Table.Column>
            <Table.Column className="admin-table__actions-column" isRowHeader>
              {copy.tableActions}
            </Table.Column>
          </Table.Header>
          <Table.Body>
            {entries.map((entry) => {
              const promoteHref = adminWaitlistPromotePath(locale, entry.id);
              const created =
                entry.createdAt instanceof Date
                  ? entry.createdAt.toISOString()
                  : String(entry.createdAt);

              return (
                <Table.Row key={entry.id}>
                  <Table.Cell>
                    <Link className="link" href={`/${locale}/admin/users/${entry.userId}`}>
                      {entry.userId}
                    </Link>
                  </Table.Cell>
                  <Table.Cell>{entry.eventId}</Table.Cell>
                  <Table.Cell>{entry.status}</Table.Cell>
                  <Table.Cell>{entry.requestedQty}</Table.Cell>
                  <Table.Cell>{entry.skippedOnce ? copy.optionYes : copy.optionNo}</Table.Cell>
                  <Table.Cell>{created}</Table.Cell>
                  <Table.Cell className="admin-table__actions-cell">
                    {entry.status === "WAITING" ? (
                      <AdminTableActions
                        actions={[
                          {
                            href: promoteHref,
                            label: copy.waitlistPromoteAction,
                            icon: "edit",
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
