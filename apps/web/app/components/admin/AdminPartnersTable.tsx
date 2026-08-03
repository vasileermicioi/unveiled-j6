"use client";

import { Paragraph, Surface, Table } from "@heroui/react";
import type { PartnerListItem, PartnerSort } from "@unveiled/db";

import { getAdminCopy } from "../../lib/admin-content";
import { formatEventDateTime } from "../../lib/admin-event-form";
import {
  type AdminListSortDir,
  buildAdminListQueryString,
  effectivePartnerListSort,
  nextPartnerColumnSort,
} from "../../lib/admin-list";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

import { AdminSortableColumnHeader } from "./AdminSortableColumnHeader";
import { AdminTableActions } from "./AdminTableActions";

type AdminPartnersTableProps = {
  locale: Locale;
  partners: PartnerListItem[];
  logoUrls: Record<string, string | undefined>;
  listPath: string;
  query: {
    q: string;
    sort?: PartnerSort;
    dir?: AdminListSortDir;
  };
};

function sortHref(
  listPath: string,
  q: string,
  currentSort: PartnerSort | undefined,
  currentDir: AdminListSortDir | undefined,
  column: PartnerSort,
): string {
  const next = nextPartnerColumnSort(currentSort, currentDir, column);
  return `${listPath}${buildAdminListQueryString({
    q: q || undefined,
    sort: next.sort,
    dir: next.dir,
    page: 1,
  })}`;
}

export function AdminPartnersTable({
  locale,
  partners,
  logoUrls,
  listPath,
  query,
}: AdminPartnersTableProps) {
  const copy = getAdminCopy(locale);
  const { sort: activeSort, dir: activeDir } = effectivePartnerListSort(query.sort, query.dir);

  if (partners.length === 0) {
    return <Paragraph color="muted">{copy.emptyPartners}</Paragraph>;
  }

  return (
    <Table aria-label={copy.partnersTitle} className="admin-table">
      <Table.ScrollContainer>
        <Table.Content>
          <Table.Header>
            <Table.Column isRowHeader>{copy.tableLogo}</Table.Column>
            <AdminSortableColumnHeader
              activeDir={activeDir}
              activeSort={activeSort}
              column="name"
              href={sortHref(listPath, query.q, query.sort, query.dir, "name")}
              label={copy.tableName}
            />
            <Table.Column isRowHeader>{copy.tableEmail}</Table.Column>
            <Table.Column isRowHeader>{copy.tableAddress}</Table.Column>
            <AdminSortableColumnHeader
              activeDir={activeDir}
              activeSort={activeSort}
              column="created"
              href={sortHref(listPath, query.q, query.sort, query.dir, "created")}
              label={copy.tableCreated}
            />
            <AdminSortableColumnHeader
              activeDir={activeDir}
              activeSort={activeSort}
              column="events"
              href={sortHref(listPath, query.q, query.sort, query.dir, "events")}
              label={copy.tableActiveEvents}
            />
            <Table.Column className="admin-table__actions-column" isRowHeader>
              {copy.tableActions}
            </Table.Column>
          </Table.Header>
          <Table.Body>
            {partners.map((partner) => (
              <Table.Row key={partner.id}>
                <Table.Cell>
                  {logoUrls[partner.id] ? (
                    <Surface className="admin-table__logo" variant="transparent">
                      <img alt="" src={logoUrls[partner.id]} />
                    </Surface>
                  ) : (
                    <Paragraph color="muted" size="sm">
                      —
                    </Paragraph>
                  )}
                </Table.Cell>
                <Table.Cell>{partner.name}</Table.Cell>
                <Table.Cell>{partner.contactEmail}</Table.Cell>
                <Table.Cell>{partner.address}</Table.Cell>
                <Table.Cell>{formatEventDateTime(partner.createdAt, locale)}</Table.Cell>
                <Table.Cell>{partner.activeEventCount}</Table.Cell>
                <Table.Cell className="admin-table__actions-cell">
                  <AdminTableActions
                    actions={[
                      {
                        href: localizedPath(locale, `admin/partners/${partner.id}/edit`),
                        label: copy.editAction,
                        icon: "edit",
                      },
                      {
                        href: localizedPath(locale, `admin/partners/${partner.id}/delete`),
                        label: copy.deleteAction,
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
