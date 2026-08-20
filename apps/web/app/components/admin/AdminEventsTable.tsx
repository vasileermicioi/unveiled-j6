"use client";

import { Paragraph, Surface, Table } from "@heroui/react";
import type { Event, EventSort } from "@unveiled/db";

import { formatAdminLanguageCode, getAdminCopy } from "../../lib/admin-content";
import { formatEventDateTime, formatEventDateTimeWithCount } from "../../lib/admin-event-form";
import {
  type AdminListSortDir,
  buildAdminListQueryString,
  effectiveEventListSort,
  nextEventColumnSort,
} from "../../lib/admin-list";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

import { AdminSortableColumnHeader } from "./AdminSortableColumnHeader";
import { AdminTableActions } from "./AdminTableActions";
import { adminEventGalleryPath } from "./admin-tabs";

type AdminEventsTableProps = {
  locale: Locale;
  events: Event[];
  imageUrls: Record<string, string | undefined>;
  listPath: string;
  query: {
    title?: string;
    partner?: string;
    language?: string;
    q?: string;
    sort?: EventSort;
    dir?: AdminListSortDir;
  };
};

function sortHref(
  listPath: string,
  query: AdminEventsTableProps["query"],
  column: EventSort,
): string {
  const next = nextEventColumnSort(query.sort, query.dir, column);
  return `${listPath}${buildAdminListQueryString({
    title: query.title,
    partner: query.partner,
    language: query.language,
    q: query.q,
    sort: next.sort,
    dir: next.dir,
    page: 1,
  })}`;
}

function formatSpokenLanguages(event: Event, locale: Locale, independentLabel: string): string {
  if (event.languageIndependent) {
    return independentLabel;
  }
  const codes = event.languages ?? [];
  if (codes.length === 0) {
    return "—";
  }
  return codes.map((code) => formatAdminLanguageCode(locale, code)).join(", ");
}

function formatSubtitleLanguage(event: Event, locale: Locale): string {
  const codes = event.subtitleLanguages ?? [];
  if (!event.hasSubtitles || codes.length === 0) {
    return "—";
  }
  return codes.map((code) => formatAdminLanguageCode(locale, code)).join(", ");
}

export function AdminEventsTable({
  locale,
  events,
  imageUrls,
  listPath,
  query,
}: AdminEventsTableProps) {
  const copy = getAdminCopy(locale);
  const { sort: activeSort, dir: activeDir } = effectiveEventListSort(query.sort, query.dir);

  if (events.length === 0) {
    return <Paragraph color="muted">{copy.emptyEvents}</Paragraph>;
  }

  return (
    <Table aria-label={copy.eventsTitle} className="admin-table">
      <Table.ScrollContainer>
        <Table.Content>
          <Table.Header>
            <Table.Column isRowHeader>{copy.tableLogo}</Table.Column>
            <AdminSortableColumnHeader
              activeDir={activeDir}
              activeSort={activeSort}
              column="title"
              href={sortHref(listPath, query, "title")}
              label={copy.tableTitle}
            />
            <AdminSortableColumnHeader
              activeDir={activeDir}
              activeSort={activeSort}
              column="partner"
              href={sortHref(listPath, query, "partner")}
              label={copy.tablePartner}
            />
            <Table.Column isRowHeader>{copy.tableLanguages}</Table.Column>
            <Table.Column isRowHeader>{copy.tableSubtitles}</Table.Column>
            <AdminSortableColumnHeader
              activeDir={activeDir}
              activeSort={activeSort}
              column="date"
              href={sortHref(listPath, query, "date")}
              label={copy.tableDate}
            />
            <AdminSortableColumnHeader
              activeDir={activeDir}
              activeSort={activeSort}
              column="created"
              href={sortHref(listPath, query, "created")}
              label={copy.tableCreated}
            />
            <AdminSortableColumnHeader
              activeDir={activeDir}
              activeSort={activeSort}
              column="capacity"
              href={sortHref(listPath, query, "capacity")}
              label={copy.tableCapacity}
            />
            <Table.Column className="admin-table__actions-column" isRowHeader>
              {copy.tableActions}
            </Table.Column>
          </Table.Header>
          <Table.Body>
            {events.map((event) => (
              <Table.Row key={event.id}>
                <Table.Cell>
                  {imageUrls[event.id] ? (
                    <Surface className="admin-table__logo" variant="transparent">
                      <img alt="" src={imageUrls[event.id]} />
                    </Surface>
                  ) : (
                    <Surface
                      aria-hidden
                      className="admin-table__logo admin-table__logo--placeholder"
                      variant="transparent"
                    >
                      <Paragraph color="muted" size="sm">
                        {copy.imagePlaceholderLabel}
                      </Paragraph>
                    </Surface>
                  )}
                </Table.Cell>
                <Table.Cell>{event.title}</Table.Cell>
                <Table.Cell>{event.partnerName}</Table.Cell>
                <Table.Cell>
                  {formatSpokenLanguages(event, locale, copy.languageIndependentLabel)}
                </Table.Cell>
                <Table.Cell>{formatSubtitleLanguage(event, locale)}</Table.Cell>
                <Table.Cell>
                  {formatEventDateTimeWithCount(
                    event.dateTime,
                    locale,
                    event.dateTimes?.length ?? 1,
                  )}
                </Table.Cell>
                <Table.Cell>{formatEventDateTime(event.createdAt, locale)}</Table.Cell>
                <Table.Cell>
                  {event.remainingCapacity}/{event.totalCapacity}
                </Table.Cell>
                <Table.Cell className="admin-table__actions-cell">
                  <AdminTableActions
                    actions={[
                      {
                        href: localizedPath(locale, `admin/events/${event.id}/edit`),
                        label: copy.editAction,
                        icon: "edit",
                      },
                      {
                        href: adminEventGalleryPath(locale, event.id),
                        label: copy.galleryManageAction,
                        icon: "gallery",
                      },
                      {
                        href: localizedPath(locale, `admin/events/${event.id}/clone`),
                        label: copy.cloneAction,
                        icon: "clone",
                      },
                      {
                        href: localizedPath(locale, `admin/events/${event.id}/delete`),
                        label: copy.deleteAction,
                        icon: "delete",
                      },
                      {
                        href: localizedPath(locale, `admin/events/${event.id}/codes`),
                        label: copy.exportCodesAction,
                        icon: "download",
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
