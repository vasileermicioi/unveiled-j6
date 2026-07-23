import { Link, Surface } from "@heroui/react";
import type { Event } from "@unveiled/db";

import { getAdminCopy } from "../../lib/admin-content";
import { buildAdminListQueryString } from "../../lib/admin-list";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

import { AdminEventsTable } from "./AdminEventsTable";
import { AdminPageShell } from "./AdminPageShell";
import { AdminPagination } from "./AdminPagination";
import { AdminSearchForm } from "./AdminSearchForm";

type AdminEventsListPageProps = {
  locale: Locale;
  events: Event[];
  imageUrls: Record<string, string | undefined>;
  query: {
    q: string;
    page: number;
    limit: number;
  };
  total: number;
};

export function AdminEventsListPage({
  locale,
  events,
  imageUrls,
  query,
  total,
}: AdminEventsListPageProps) {
  const copy = getAdminCopy(locale);
  const listPath = `/${locale}/admin/events`;
  const queryString = buildAdminListQueryString({ q: query.q || undefined, page: query.page });

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
          <Link
            className="button button--secondary button--md"
            href={localizedPath(locale, "admin/events/series/new")}
          >
            {copy.newEventSeries}
          </Link>
        </Surface>
      }
      subtitle={copy.eventsSubtitle}
      title={copy.eventsTitle}
    >
      <AdminSearchForm action={listPath} defaultQuery={query.q} locale={locale} />
      <AdminEventsTable events={events} imageUrls={imageUrls} locale={locale} />
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
