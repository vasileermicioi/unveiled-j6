import type { AdminWaitlistRow } from "@unveiled/db";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

import { AdminPageShell, adminWaitlistPath } from "./AdminPageShell";
import { AdminPagination } from "./AdminPagination";
import { AdminWaitlistSearchForm } from "./AdminWaitlistSearchForm";
import { AdminWaitlistTable } from "./AdminWaitlistTable";

type AdminWaitlistListPageProps = {
  locale: Locale;
  entries: AdminWaitlistRow[];
  total: number;
  page: number;
  pageSize: number;
  eventId?: string;
  status?: string;
  queryString: string;
};

export function AdminWaitlistListPage({
  locale,
  entries,
  total,
  page,
  pageSize,
  eventId = "",
  status = "",
  queryString,
}: AdminWaitlistListPageProps) {
  const copy = getAdminCopy(locale);
  const listPath = adminWaitlistPath(locale);

  return (
    <AdminPageShell subtitle={copy.waitlistSubtitle} title={copy.waitlistTitle} wrapInCard={false}>
      <AdminWaitlistSearchForm
        action={listPath}
        defaultEventId={eventId}
        defaultStatus={status}
        locale={locale}
      />
      <AdminWaitlistTable entries={entries} locale={locale} />
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
