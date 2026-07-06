"use client";

import { Link, Paragraph, Surface, Table } from "@heroui/react";
import type { Partner } from "@unveiled/db";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

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
            <Table.Column isRowHeader>{copy.tableActions}</Table.Column>
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
                <Table.Cell>
                  <Surface className="flex flex-wrap gap-2" variant="transparent">
                    <Link
                      className="button button--secondary button--sm"
                      href={localizedPath(locale, `admin/partners/${partner.id}/edit`)}
                    >
                      {copy.editAction}
                    </Link>
                    <Link
                      className="button button--secondary button--sm"
                      href={localizedPath(locale, `admin/partners/${partner.id}/delete`)}
                    >
                      {copy.deleteAction}
                    </Link>
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
