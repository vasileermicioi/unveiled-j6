import { Link, Paragraph, Surface, Table } from "@heroui/react";
import type { MemberListItem, MemberSort, SubscriptionStatus, UserRole } from "@unveiled/db";

import { getAdminCopy } from "../../lib/admin-content";
import {
  type AdminListSortDir,
  buildAdminUsersListQueryString,
  effectiveMemberListSort,
  nextMemberColumnSort,
} from "../../lib/admin-list";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

import { AdminSortableColumnHeader } from "./AdminSortableColumnHeader";
import { AdminTableActions } from "./AdminTableActions";
import { memberDisplayName } from "./member-display";

export type AdminUsersTableQuery = {
  q: string;
  role?: UserRole;
  subscription?: SubscriptionStatus | "NONE";
  creditsMin?: number;
  creditsMax?: number;
  bookingsMin?: number;
  bookingsMax?: number;
  eventOpensMin?: number;
  eventOpensMax?: number;
  createdFrom?: string;
  createdTo?: string;
  sort?: MemberSort;
  dir?: AdminListSortDir;
};

type AdminUsersTableProps = {
  locale: Locale;
  members: MemberListItem[];
  listPath: string;
  query: AdminUsersTableQuery;
};

function sortHref(listPath: string, query: AdminUsersTableQuery, column: MemberSort): string {
  const next = nextMemberColumnSort(query.sort, query.dir, column);
  return `${listPath}${buildAdminUsersListQueryString({
    q: query.q || undefined,
    role: query.role,
    subscription: query.subscription,
    creditsMin: query.creditsMin,
    creditsMax: query.creditsMax,
    bookingsMin: query.bookingsMin,
    bookingsMax: query.bookingsMax,
    eventOpensMin: query.eventOpensMin,
    eventOpensMax: query.eventOpensMax,
    createdFrom: query.createdFrom || undefined,
    createdTo: query.createdTo || undefined,
    sort: next.sort,
    dir: next.dir,
    page: 1,
  })}`;
}

function formatMemberCreated(date: Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "de" ? "de-DE" : "en-GB", {
    timeZone: "Europe/Berlin",
    dateStyle: "medium",
  }).format(date);
}

export function AdminUsersTable({ locale, members, listPath, query }: AdminUsersTableProps) {
  const copy = getAdminCopy(locale);
  const { sort: activeSort, dir: activeDir } = effectiveMemberListSort(query.sort, query.dir);

  if (members.length === 0) {
    return <Paragraph color="muted">{copy.emptyUsers}</Paragraph>;
  }

  return (
    <Table aria-label={copy.usersTitle} className="admin-table">
      <Table.ScrollContainer>
        <Table.Content>
          <Table.Header>
            <AdminSortableColumnHeader
              activeDir={activeDir}
              activeSort={activeSort}
              column="member"
              href={sortHref(listPath, query, "member")}
              label={copy.usersColMember}
            />
            <AdminSortableColumnHeader
              activeDir={activeDir}
              activeSort={activeSort}
              column="role"
              href={sortHref(listPath, query, "role")}
              label={copy.usersColRole}
            />
            <AdminSortableColumnHeader
              activeDir={activeDir}
              activeSort={activeSort}
              column="subscription"
              href={sortHref(listPath, query, "subscription")}
              label={copy.usersColSubscription}
            />
            <AdminSortableColumnHeader
              activeDir={activeDir}
              activeSort={activeSort}
              column="credits"
              href={sortHref(listPath, query, "credits")}
              label={copy.usersColCredits}
            />
            <AdminSortableColumnHeader
              activeDir={activeDir}
              activeSort={activeSort}
              column="bookings"
              href={sortHref(listPath, query, "bookings")}
              label={copy.usersColBookings}
            />
            <AdminSortableColumnHeader
              activeDir={activeDir}
              activeSort={activeSort}
              column="eventOpens"
              href={sortHref(listPath, query, "eventOpens")}
              label={copy.usersColEventOpens}
            />
            <AdminSortableColumnHeader
              activeDir={activeDir}
              activeSort={activeSort}
              column="created"
              href={sortHref(listPath, query, "created")}
              label={copy.usersColCreated}
            />
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
                    <Surface className="flex flex-col gap-1" variant="transparent">
                      <Link className="link" href={detailHref}>
                        {name}
                      </Link>
                      <Paragraph color="muted" size="sm">
                        {member.email}
                      </Paragraph>
                    </Surface>
                  </Table.Cell>
                  <Table.Cell>{member.role}</Table.Cell>
                  <Table.Cell>{member.subscriptionStatus ?? copy.usersNoValue}</Table.Cell>
                  <Table.Cell>{member.credits}</Table.Cell>
                  <Table.Cell>{member.bookingCount}</Table.Cell>
                  <Table.Cell>
                    {member.eventOpenCount == null ? copy.usersNoValue : member.eventOpenCount}
                  </Table.Cell>
                  <Table.Cell>{formatMemberCreated(member.createdAt, locale)}</Table.Cell>
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
