import { Link, Paragraph, Surface } from "@heroui/react";
import type { Event, EventSort } from "@unveiled/db";

import { getAdminCopy } from "../../lib/admin-content";
import {
  type AdminListSortDir,
  type AdminPublishedFilter,
  buildAdminListQueryString,
  isDefaultEventListSort,
} from "../../lib/admin-list";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

import { AdminEventsListFilters } from "./AdminEventsListFilters";
import { AdminEventsTable } from "./AdminEventsTable";
import { AdminPageShell } from "./AdminPageShell";
import { AdminPagination } from "./AdminPagination";

type AdminEventsListPageProps = {
  locale: Locale;
  events: Event[];
  imageUrls: Record<string, string | undefined>;
  query: {
    title: string;
    partner: string;
    language: string;
    published?: AdminPublishedFilter;
    page: number;
    limit: number;
    sort?: EventSort;
    dir?: AdminListSortDir;
  };
  total: number;
  successMessage?: string | null;
};

export function AdminEventsListPage({
  locale,
  events,
  imageUrls,
  query,
  total,
  successMessage = null,
}: AdminEventsListPageProps) {
  const copy = getAdminCopy(locale);
  const listPath = `/${locale}/admin/events`;
  const queryString = buildAdminListQueryString({
    title: query.title || undefined,
    partner: query.partner || undefined,
    language: query.language || undefined,
    published: query.published,
    page: query.page,
    sort: query.sort,
    dir: query.dir,
  });
  const hasFilters =
    Boolean(query.title || query.partner || query.language || query.published) ||
    !isDefaultEventListSort(query.sort, query.dir);
  const preserveParams =
    query.sort && query.dir && !isDefaultEventListSort(query.sort, query.dir)
      ? { sort: query.sort, dir: query.dir }
      : undefined;

  return (
    <AdminPageShell
      eyebrow={copy.pageEyebrow}
      actions={
        <Surface className="flex flex-wrap gap-3" variant="transparent">
          <Link
            className="button button--primary button--md"
            href={localizedPath(locale, "admin/events/new")}
          >
            {copy.newEvent}
          </Link>
        </Surface>
      }
      subtitle={copy.eventsSubtitle}
      title={copy.eventsTitle}
    >
      {successMessage ? (
        <Paragraph className="admin-flash admin-flash--success">{successMessage}</Paragraph>
      ) : null}
      <AdminEventsListFilters
        action={listPath}
        language={query.language}
        locale={locale}
        partner={query.partner}
        preserveParams={preserveParams}
        published={query.published}
        resetHref={hasFilters ? listPath : undefined}
        title={query.title}
      />
      <AdminEventsTable
        events={events}
        imageUrls={imageUrls}
        listPath={listPath}
        locale={locale}
        query={{
          title: query.title,
          partner: query.partner,
          language: query.language,
          published: query.published,
          sort: query.sort,
          dir: query.dir,
        }}
      />
      <AdminPagination
        basePath={listPath}
        locale={locale}
        page={query.page}
        pageSize={query.limit}
        queryString={queryString}
        total={total}
      />
    </AdminPageShell>
  );
}
