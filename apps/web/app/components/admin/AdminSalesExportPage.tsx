import {
  Button,
  Form,
  Input,
  Label,
  Link,
  Paragraph,
  Surface,
  Table,
  TextField,
} from "@heroui/react";
import { buildSalesExportQueryString, type SalesByEventRow } from "@unveiled/db";

import { getAdminCopy } from "../../lib/admin-content";
import { formatEventDateTime } from "../../lib/admin-event-form";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

import { AdminFormError } from "./AdminFormError";
import { AdminPageShell } from "./AdminPageShell";

type AdminSalesExportPageProps = {
  locale: Locale;
  from: string;
  to: string;
  titleFilter?: string;
  partnerFilter?: string;
  rows: SalesByEventRow[];
  periodError?: boolean;
};

export function AdminSalesExportPage({
  locale,
  from,
  to,
  titleFilter = "",
  partnerFilter = "",
  rows,
  periodError = false,
}: AdminSalesExportPageProps) {
  const copy = getAdminCopy(locale);
  const formAction = localizedPath(locale, "admin/partners/export");
  const csvHref = `${formAction}${buildSalesExportQueryString({
    from,
    to,
    title: titleFilter,
    partner: partnerFilter,
    format: "csv",
  })}`;
  const hasTextFilters = Boolean(titleFilter || partnerFilter);
  const resetHref = hasTextFilters
    ? `${formAction}${buildSalesExportQueryString({ from, to })}`
    : undefined;

  return (
    <AdminPageShell
      breadcrumbs={[
        { label: copy.partnersTitle, href: localizedPath(locale, "admin/partners") },
        { label: copy.salesExportTitle },
      ]}
      eyebrow={copy.pageEyebrow}
      subtitle={copy.salesExportSubtitle}
      title={copy.salesExportTitle}
      actions={
        periodError ? undefined : (
          <Link className="button button--secondary button--md" href={csvHref}>
            {copy.salesExportCsvDownload}
          </Link>
        )
      }
    >
      {periodError ? <AdminFormError message={copy.salesExportPeriodError} /> : null}

      <Form
        action={formAction}
        className="admin-list-filters flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end"
        method="get"
      >
        <TextField
          className="w-full min-w-0 flex-1 lg:min-w-[14rem]"
          defaultValue={titleFilter}
          fullWidth
          name="title"
        >
          <Label htmlFor="sales-export-title">{copy.salesExportTitleFilter}</Label>
          <Input id="sales-export-title" placeholder={copy.salesExportTitleFilter} type="search" />
        </TextField>
        <TextField
          className="w-full min-w-0 flex-1 lg:min-w-[14rem]"
          defaultValue={partnerFilter}
          fullWidth
          name="partner"
        >
          <Label htmlFor="sales-export-partner">{copy.salesExportPartnerFilter}</Label>
          <Input
            id="sales-export-partner"
            placeholder={copy.salesExportPartnerFilter}
            type="search"
          />
        </TextField>
        <TextField
          className="admin-form__native-date-field w-full max-w-[11rem] shrink-0"
          defaultValue={from}
          name="from"
        >
          <Label>{copy.salesExportFromLabel}</Label>
          <Input className="admin-form__native-input" type="date" />
        </TextField>
        <TextField
          className="admin-form__native-date-field w-full max-w-[11rem] shrink-0"
          defaultValue={to}
          name="to"
        >
          <Label>{copy.salesExportToLabel}</Label>
          <Input className="admin-form__native-input" type="date" />
        </TextField>
        <Surface className="flex shrink-0 flex-wrap gap-2" variant="transparent">
          <Button className="button button--secondary button--md shrink-0" type="submit">
            {copy.salesExportSubmit}
          </Button>
          {resetHref ? (
            <Link className="button button--secondary button--md shrink-0" href={resetHref}>
              {copy.resetFilters}
            </Link>
          ) : null}
        </Surface>
      </Form>

      {periodError ? null : rows.length === 0 ? (
        <Paragraph color="muted">{copy.salesExportEmpty}</Paragraph>
      ) : (
        <Table aria-label={copy.salesExportTitle} className="admin-table">
          <Table.ScrollContainer>
            <Table.Content>
              <Table.Header>
                <Table.Column isRowHeader>{copy.tableTitle}</Table.Column>
                <Table.Column isRowHeader>{copy.tablePartner}</Table.Column>
                <Table.Column isRowHeader>{copy.tableDate}</Table.Column>
                <Table.Column isRowHeader>{copy.salesExportTicketsSold}</Table.Column>
              </Table.Header>
              <Table.Body>
                {rows.map((row) => (
                  <Table.Row key={row.eventId}>
                    <Table.Cell>{row.title}</Table.Cell>
                    <Table.Cell>{row.partnerName}</Table.Cell>
                    <Table.Cell>{formatEventDateTime(row.dateTime, locale)}</Table.Cell>
                    <Table.Cell>{row.ticketsSold}</Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      )}

      {!periodError && rows.length > 0 ? (
        <Surface className="flex justify-start" variant="transparent">
          <Link className="button button--secondary button--md" href={csvHref}>
            {copy.salesExportCsvDownload}
          </Link>
        </Surface>
      ) : null}
    </AdminPageShell>
  );
}
