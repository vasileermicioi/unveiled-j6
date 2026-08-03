import type { Event, EventSort } from "@unveiled/db";

import { getAdminCopy } from "../../lib/admin-content";
import {
  type AdminListSortDir,
  buildAdminListQueryString,
  isDefaultEventListSort,
} from "../../lib/admin-list";
import type { Locale } from "../../lib/locale";

import { AdminEventsListFilters } from "./AdminEventsListFilters";
import { AdminFeaturedAddResults } from "./AdminFeaturedAddResults";
import { AdminFormError } from "./AdminFormError";
import { AdminPageShell, adminFeaturedPath } from "./AdminPageShell";
import { adminFeaturedAddPath } from "./admin-tabs";

type AdminFeaturedAddPageProps = {
  locale: Locale;
  events: Event[];
  imageUrls: Record<string, string | undefined>;
  query: {
    title: string;
    partner: string;
    language: string;
    sort?: EventSort;
    dir?: AdminListSortDir;
  };
  error?: string | null;
};

export function AdminFeaturedAddPage({
  locale,
  events,
  imageUrls,
  query,
  error,
}: AdminFeaturedAddPageProps) {
  const copy = getAdminCopy(locale);
  const listHref = adminFeaturedPath(locale);
  const addPath = adminFeaturedAddPath(locale);
  const hasFilters =
    Boolean(query.title || query.partner || query.language) ||
    !isDefaultEventListSort(query.sort, query.dir);
  const preserveParams =
    query.sort && query.dir && !isDefaultEventListSort(query.sort, query.dir)
      ? { sort: query.sort, dir: query.dir }
      : undefined;
  const resetHref = hasFilters ? `${addPath}${buildAdminListQueryString({})}` : undefined;

  return (
    <AdminPageShell
      eyebrow={copy.pageEyebrow}
      breadcrumbs={[
        { label: copy.featuredTitle, href: listHref },
        { label: copy.featuredAddTitle },
      ]}
      subtitle={copy.featuredAddSubtitle}
      title={copy.featuredAddTitle}
    >
      {error ? <AdminFormError message={error} /> : null}
      <AdminEventsListFilters
        action={addPath}
        language={query.language}
        locale={locale}
        partner={query.partner}
        preserveParams={preserveParams}
        resetHref={resetHref}
        title={query.title}
      />
      <AdminFeaturedAddResults
        events={events}
        imageUrls={imageUrls}
        listPath={addPath}
        locale={locale}
        query={query}
      />
    </AdminPageShell>
  );
}
