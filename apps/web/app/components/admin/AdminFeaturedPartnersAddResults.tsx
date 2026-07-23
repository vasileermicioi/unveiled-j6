"use client";

import { Button, Form, Input, Paragraph, Surface, Table } from "@heroui/react";
import type { Partner } from "@unveiled/db";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

import { adminFeaturedPartnersAddPath } from "./admin-tabs";

type AdminFeaturedPartnersAddResultsProps = {
  locale: Locale;
  partners: Partner[];
  logoUrls: Record<string, string | undefined>;
};

export function AdminFeaturedPartnersAddResults({
  locale,
  partners,
  logoUrls,
}: AdminFeaturedPartnersAddResultsProps) {
  const copy = getAdminCopy(locale);
  const action = adminFeaturedPartnersAddPath(locale);

  if (partners.length === 0) {
    return <Paragraph color="muted">{copy.featuredPartnersAddEmpty}</Paragraph>;
  }

  return (
    <Table aria-label={copy.featuredPartnersAddTitle} className="admin-table">
      <Table.ScrollContainer>
        <Table.Content>
          <Table.Header>
            <Table.Column isRowHeader>{copy.tableLogo}</Table.Column>
            <Table.Column isRowHeader>{copy.tableName}</Table.Column>
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
                <Table.Cell>{partner.address}</Table.Cell>
                <Table.Cell className="admin-table__actions-cell">
                  <Surface variant="transparent">
                    <Form action={action} method="post">
                      <Input name="partnerId" type="hidden" value={partner.id} />
                      <Button className="button button--primary button--sm" type="submit">
                        {copy.featuredPartnersAddSubmit}
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
