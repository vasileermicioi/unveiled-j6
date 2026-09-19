import { Chip, Link, Paragraph, Surface, Table } from "@heroui/react";
import { buildEventsExportQueryString, type Event } from "@unveiled/db";

import { getAdminCopy } from "../../lib/admin-content";
import { formatEventDateTimeWithCount } from "../../lib/admin-event-form";
import type { AdminPublishedFilter } from "../../lib/admin-list";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

import { AdminEventsListFilters } from "./AdminEventsListFilters";
import { AdminPageShell } from "./AdminPageShell";

type AdminEventsExportPageProps = {
  locale: Locale;
  events: Event[];
  titleFilter?: string;
  partnerFilter?: string;
  languageFilter?: string;
  publishedFilter?: AdminPublishedFilter;
};

export function AdminEventsExportPage({
  locale,
  events,
  titleFilter = "",
  partnerFilter = "",
  languageFilter = "",
  publishedFilter,
}: AdminEventsExportPageProps) {
  const copy = getAdminCopy(locale);
  const formAction = localizedPath(locale, "admin/events/export");
  const csvHref = `${formAction}${buildEventsExportQueryString({
    title: titleFilter,
    partner: partnerFilter,
    language: languageFilter,
    published: publishedFilter,
    format: "csv",
  })}`;
  const hasFilters = Boolean(titleFilter || partnerFilter || languageFilter || publishedFilter);
  const resetHref = hasFilters ? formAction : undefined;

  return (
    <AdminPageShell
      breadcrumbs={[
        { label: copy.eventsTitle, href: localizedPath(locale, "admin/events") },
        { label: copy.eventsExportTitle },
      ]}
      eyebrow={copy.pageEyebrow}
      subtitle={copy.eventsExportSubtitle}
      title={copy.eventsExportTitle}
      actions={
        events.length > 0 ? (
          <Link className="button button--secondary button--md" href={csvHref}>
            {copy.eventsExportCsvDownload}
          </Link>
        ) : undefined
      }
    >
      <AdminEventsListFilters
        action={formAction}
        language={languageFilter}
        locale={locale}
        partner={partnerFilter}
        published={publishedFilter}
        resetHref={resetHref}
        title={titleFilter}
      />
      <Paragraph color="muted">{copy.eventsExportCount(events.length)}</Paragraph>
      {events.length === 0 ? (
        <Paragraph color="muted">{copy.eventsExportEmpty}</Paragraph>
      ) : (
        <Table aria-label={copy.eventsExportTitle} className="admin-table">
          <Table.ScrollContainer>
            <Table.Content>
              <Table.Header>
                <Table.Column isRowHeader>{copy.tableTitle}</Table.Column>
                <Table.Column isRowHeader>{copy.tablePartner}</Table.Column>
                <Table.Column isRowHeader>{copy.tableDate}</Table.Column>
                <Table.Column isRowHeader>{copy.eventsPublishedFilter}</Table.Column>
                <Table.Column isRowHeader>{copy.tableCapacity}</Table.Column>
              </Table.Header>
              <Table.Body>
                {events.map((event) => (
                  <Table.Row key={event.id}>
                    <Table.Cell>{event.title}</Table.Cell>
                    <Table.Cell>{event.partnerName}</Table.Cell>
                    <Table.Cell>
                      {formatEventDateTimeWithCount(
                        event.dateTime,
                        locale,
                        event.dateTimes?.length ?? 1,
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <Chip variant="tertiary">
                        <Chip.Label>
                          {event.published ? copy.statusPublished : copy.statusDraft}
                        </Chip.Label>
                      </Chip>
                    </Table.Cell>
                    <Table.Cell>
                      {event.remainingCapacity}/{event.totalCapacity}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      )}
      {events.length > 0 ? (
        <Surface className="flex justify-start" variant="transparent">
          <Link className="button button--secondary button--md" href={csvHref}>
            {copy.eventsExportCsvDownload}
          </Link>
        </Surface>
      ) : null}
    </AdminPageShell>
  );
}
