import type { PartnerListItem, PartnerSort } from "@unveiled/db";

import { getAdminCopy } from "../../lib/admin-content";
import {
  type AdminListSortDir,
  buildAdminListQueryString,
  isDefaultPartnerListSort,
} from "../../lib/admin-list";
import type { Locale } from "../../lib/locale";

import { AdminFeaturedPartnersAddResults } from "./AdminFeaturedPartnersAddResults";
import { AdminFormError } from "./AdminFormError";
import { AdminPageShell, adminFeaturedPartnersPath } from "./AdminPageShell";
import { AdminSearchForm } from "./AdminSearchForm";
import { adminFeaturedPartnersAddPath } from "./admin-tabs";

type AdminFeaturedPartnersAddPageProps = {
  locale: Locale;
  partners: PartnerListItem[];
  logoUrls: Record<string, string | undefined>;
  query: {
    q: string;
    sort?: PartnerSort;
    dir?: AdminListSortDir;
  };
  error?: string | null;
};

export function AdminFeaturedPartnersAddPage({
  locale,
  partners,
  logoUrls,
  query,
  error,
}: AdminFeaturedPartnersAddPageProps) {
  const copy = getAdminCopy(locale);
  const listHref = adminFeaturedPartnersPath(locale);
  const addPath = adminFeaturedPartnersAddPath(locale);
  const hasFilters = Boolean(query.q) || !isDefaultPartnerListSort(query.sort, query.dir);
  const preserveParams =
    query.sort && query.dir && !isDefaultPartnerListSort(query.sort, query.dir)
      ? { sort: query.sort, dir: query.dir }
      : undefined;
  const resetHref = hasFilters ? `${addPath}${buildAdminListQueryString({})}` : undefined;

  return (
    <AdminPageShell
      eyebrow={copy.pageEyebrow}
      breadcrumbs={[
        { label: copy.featuredPartnersTitle, href: listHref },
        { label: copy.featuredPartnersAddTitle },
      ]}
      subtitle={copy.featuredPartnersAddSubtitle}
      title={copy.featuredPartnersAddTitle}
    >
      {error ? <AdminFormError message={error} /> : null}
      <AdminSearchForm
        action={addPath}
        defaultQuery={query.q}
        locale={locale}
        placeholder={copy.partnersSearchPlaceholder}
        preserveParams={preserveParams}
        resetHref={resetHref}
      />
      <AdminFeaturedPartnersAddResults
        listPath={addPath}
        locale={locale}
        logoUrls={logoUrls}
        partners={partners}
        query={query}
      />
    </AdminPageShell>
  );
}
