import { Link, Surface } from "@heroui/react";
import type { PartnerListItem, PartnerSort } from "@unveiled/db";

import { getAdminCopy } from "../../lib/admin-content";
import {
  type AdminListSortDir,
  buildAdminListQueryString,
  isDefaultPartnerListSort,
} from "../../lib/admin-list";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

import { AdminPageShell } from "./AdminPageShell";
import { AdminPagination } from "./AdminPagination";
import { AdminPartnersTable } from "./AdminPartnersTable";
import { AdminSearchForm } from "./AdminSearchForm";

type AdminPartnersListPageProps = {
  locale: Locale;
  partners: PartnerListItem[];
  logoUrls: Record<string, string | undefined>;
  query: {
    q: string;
    page: number;
    limit: number;
    sort?: PartnerSort;
    dir?: AdminListSortDir;
  };
  total: number;
};

export function AdminPartnersListPage({
  locale,
  partners,
  logoUrls,
  query,
  total,
}: AdminPartnersListPageProps) {
  const copy = getAdminCopy(locale);
  const listPath = `/${locale}/admin/partners`;
  const queryString = buildAdminListQueryString({
    q: query.q || undefined,
    page: query.page,
    sort: query.sort,
    dir: query.dir,
  });
  const hasFilters = Boolean(query.q) || !isDefaultPartnerListSort(query.sort, query.dir);
  const preserveParams =
    query.sort && query.dir && !isDefaultPartnerListSort(query.sort, query.dir)
      ? { sort: query.sort, dir: query.dir }
      : undefined;

  return (
    <AdminPageShell
      eyebrow={copy.pageEyebrow}
      actions={
        <Surface className="flex flex-wrap gap-2" variant="transparent">
          <Link
            className="button button--secondary button--md"
            href={localizedPath(locale, "admin/partners/export")}
          >
            {copy.exportAction}
          </Link>
          <Link
            className="button button--primary button--md"
            href={localizedPath(locale, "admin/partners/new")}
          >
            {copy.newPartner}
          </Link>
        </Surface>
      }
      subtitle={copy.partnersSubtitle}
      title={copy.partnersTitle}
    >
      <AdminSearchForm
        action={listPath}
        defaultQuery={query.q}
        locale={locale}
        placeholder={copy.partnersSearchPlaceholder}
        preserveParams={preserveParams}
        resetHref={hasFilters ? listPath : undefined}
      />
      <AdminPartnersTable
        listPath={listPath}
        locale={locale}
        logoUrls={logoUrls}
        partners={partners}
        query={{ q: query.q, sort: query.sort, dir: query.dir }}
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
