import { Link } from "@heroui/react";
import type { Partner } from "@unveiled/db";

import { getAdminCopy } from "../../lib/admin-content";
import { buildAdminListQueryString } from "../../lib/admin-route";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

import { AdminPageShell, adminDashboardPath, adminPartnersPath } from "./AdminPageShell";
import { AdminPagination } from "./AdminPagination";
import { AdminPartnersTable } from "./AdminPartnersTable";
import { AdminSearchForm } from "./AdminSearchForm";

type AdminPartnersListPageProps = {
  locale: Locale;
  partners: Partner[];
  logoUrls: Record<string, string | undefined>;
  query: {
    q: string;
    page: number;
    limit: number;
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
  const listPath = adminPartnersPath(locale);
  const queryString = buildAdminListQueryString({ q: query.q || undefined, page: query.page });

  return (
    <AdminPageShell
      actions={
        <Link
          className="button button--primary button--md"
          href={localizedPath(locale, "admin/partners/new")}
        >
          {copy.newPartner}
        </Link>
      }
      breadcrumbs={[
        { label: copy.navDashboard, href: adminDashboardPath(locale) },
        { label: copy.partnersTitle },
      ]}
      locale={locale}
      subtitle={copy.partnersSubtitle}
      title={copy.partnersTitle}
    >
      <AdminSearchForm action={listPath} defaultQuery={query.q} locale={locale} />
      <AdminPartnersTable locale={locale} logoUrls={logoUrls} partners={partners} />
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
