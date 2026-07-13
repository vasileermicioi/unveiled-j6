"use client";

import { Link, Paragraph, Table } from "@heroui/react";
import type { MemberListItem } from "@unveiled/db";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

import { AdminTableActions } from "./AdminTableActions";
import { memberDisplayName } from "./member-display";

type AdminUsersTableProps = {
  locale: Locale;
  members: MemberListItem[];
};

export function AdminUsersTable({ locale, members }: AdminUsersTableProps) {
  const copy = getAdminCopy(locale);

  if (members.length === 0) {
    return <Paragraph color="muted">{copy.emptyUsers}</Paragraph>;
  }

  return (
    <Table aria-label={copy.usersTitle} className="admin-table">
      <Table.ScrollContainer>
        <Table.Content>
          <Table.Header>
            <Table.Column isRowHeader>{copy.tableName}</Table.Column>
            <Table.Column isRowHeader>{copy.tableEmail}</Table.Column>
            <Table.Column isRowHeader>{copy.usersColRole}</Table.Column>
            <Table.Column isRowHeader>{copy.usersColSubscription}</Table.Column>
            <Table.Column isRowHeader>{copy.usersColCredits}</Table.Column>
            <Table.Column isRowHeader>{copy.usersColBookings}</Table.Column>
            <Table.Column isRowHeader>{copy.usersColEventOpens}</Table.Column>
            <Table.Column className="admin-table__actions-column" isRowHeader>
              {copy.tableActions}
            </Table.Column>
          </Table.Header>
          <Table.Body>
            {members.map((member) => {
              const detailHref = localizedPath(locale, `admin/users/${member.id}`);
              const name = memberDisplayName(member.profile, member.email);

              return (
                <Table.Row key={member.id}>
                  <Table.Cell>
                    <Link className="link" href={detailHref}>
                      {name}
                    </Link>
                  </Table.Cell>
                  <Table.Cell>{member.email}</Table.Cell>
                  <Table.Cell>{member.role}</Table.Cell>
                  <Table.Cell>{member.subscriptionStatus ?? copy.usersNoValue}</Table.Cell>
                  <Table.Cell>{member.credits}</Table.Cell>
                  <Table.Cell>{member.bookingCount}</Table.Cell>
                  <Table.Cell>
                    {member.eventOpenCount == null ? copy.usersNoValue : member.eventOpenCount}
                  </Table.Cell>
                  <Table.Cell className="admin-table__actions-cell">
                    <AdminTableActions
                      actions={[
                        {
                          href: detailHref,
                          label: copy.usersViewAction,
                          icon: "edit",
                        },
                      ]}
                    />
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
