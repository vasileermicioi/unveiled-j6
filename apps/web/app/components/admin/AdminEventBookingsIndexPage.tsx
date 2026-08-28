import type { EventBookingStatsRow } from "@unveiled/db";

import { getAdminCopy } from "../../lib/admin-content";
import { buildAdminListQueryString } from "../../lib/admin-list";
import type { Locale } from "../../lib/locale";

import { AdminEventBookingStatsTable } from "./AdminEventBookingStatsTable";
import { AdminEventBookingsIndexFilters } from "./AdminEventBookingsIndexFilters";
import { AdminPageShell, adminBookingsPath } from "./AdminPageShell";
import { AdminPagination } from "./AdminPagination";

type AdminEventBookingsIndexPageProps = {
  locale: Locale;
  items: EventBookingStatsRow[];
  total: number;
  title: string;
  partner: string;
  page: number;
  pageSize: number;
};

export function AdminEventBookingsIndexPage({
  locale,
  items,
  total,
  title,
  partner,
  page,
  pageSize,
}: AdminEventBookingsIndexPageProps) {
  const copy = getAdminCopy(locale);
  const listPath = adminBookingsPath(locale);
  const queryString = buildAdminListQueryString({
    title: title || undefined,
    partner: partner || undefined,
    page,
  });
  const hasFilters = Boolean(title || partner);

  return (
    <AdminPageShell
      eyebrow={copy.pageEyebrow}
      subtitle={copy.bookingsIndexSubtitle}
      title={copy.bookingsIndexTitle}
    >
      <AdminEventBookingsIndexFilters
        action={listPath}
        locale={locale}
        partner={partner}
        resetHref={hasFilters ? listPath : undefined}
        title={title}
      />
      <AdminEventBookingStatsTable items={items} locale={locale} />
      <AdminPagination
        basePath={listPath}
        locale={locale}
        page={page}
        pageSize={pageSize}
        queryString={queryString}
        total={total}
      />
    </AdminPageShell>
  );
}
