"use client";

import { Paragraph, Surface, Table } from "@heroui/react";
import type { Partner } from "@unveiled/db";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

import { AdminTableActions } from "./AdminTableActions";

type AdminPartnersTableProps = {
  locale: Locale;
  partners: Partner[];
  logoUrls: Record<string, string | undefined>;
};

export function AdminPartnersTable({ locale, partners, logoUrls }: AdminPartnersTableProps) {
  const copy = getAdminCopy(locale);

  if (partners.length === 0) {
    return <Paragraph color="muted">{copy.emptyPartners}</Paragraph>;
  }

  return (
    <Table aria-label={copy.partnersTitle} className="admin-table">
      <Table.ScrollContainer>
        <Table.Content>
          <Table.Header>
            <Table.Column isRowHeader>{copy.tableLogo}</Table.Column>
            <Table.Column isRowHeader>{copy.tableName}</Table.Column>
            <Table.Column isRowHeader>{copy.tableEmail}</Table.Column>
            <Table.Column isRowHeader>{copy.tableAddress}</Table.Column>
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
