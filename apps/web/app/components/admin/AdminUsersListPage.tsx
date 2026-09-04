import { Paragraph } from "@heroui/react";
import type { MemberListItem, MemberSort, SubscriptionStatus, UserRole } from "@unveiled/db";

import { getAdminCopy } from "../../lib/admin-content";
import {
  type AdminListSortDir,
  buildAdminUsersListQueryString,
  isDefaultMemberListSort,
} from "../../lib/admin-list";
import type { Locale } from "../../lib/locale";

import { AdminPageShell } from "./AdminPageShell";
import { AdminPagination } from "./AdminPagination";
import { AdminUsersSearchForm } from "./AdminUsersSearchForm";
import { AdminUsersTable } from "./AdminUsersTable";

type AdminUsersListPageProps = {
  locale: Locale;
  members: MemberListItem[];
  query: {
    q: string;
    page: number;
    limit: number;
    role?: UserRole;
    subscription?: SubscriptionStatus | "NONE";
    creditsMin?: number;
    creditsMax?: number;
    bookingsMin?: number;
    bookingsMax?: number;
    eventOpensMin?: number;
    eventOpensMax?: number;
    createdFrom?: string;
    createdTo?: string;
    sort?: MemberSort;
    dir?: AdminListSortDir;
  };
  total: number;
  successMessage?: string | null;
};

export function AdminUsersListPage({
  locale,
  members,
  query,
  total,
  successMessage = null,
}: AdminUsersListPageProps) {
  const copy = getAdminCopy(locale);
  const listPath = `/${locale}/admin/users`;
  const queryString = buildAdminUsersListQueryString({
    q: query.q || undefined,
    page: query.page,
    role: query.role,
    subscription: query.subscription,
    creditsMin: query.creditsMin,
    creditsMax: query.creditsMax,
    bookingsMin: query.bookingsMin,
    bookingsMax: query.bookingsMax,
    eventOpensMin: query.eventOpensMin,
    eventOpensMax: query.eventOpensMax,
    createdFrom: query.createdFrom || undefined,
    createdTo: query.createdTo || undefined,
    sort: query.sort,
    dir: query.dir,
  });
  const hasFilters =
    Boolean(
      query.q ||
        query.role ||
        query.subscription ||
        query.creditsMin !== undefined ||
        query.creditsMax !== undefined ||
        query.bookingsMin !== undefined ||
        query.bookingsMax !== undefined ||
        query.eventOpensMin !== undefined ||
        query.eventOpensMax !== undefined ||
        query.createdFrom ||
        query.createdTo,
    ) || !isDefaultMemberListSort(query.sort, query.dir);
  const preserveParams =
    query.sort && query.dir && !isDefaultMemberListSort(query.sort, query.dir)
      ? { sort: query.sort, dir: query.dir }
      : undefined;

  return (
    <AdminPageShell
      eyebrow={copy.pageEyebrow}
      subtitle={copy.usersSubtitle}
      title={copy.usersTitle}
    >
      {successMessage ? (
        <Paragraph className="admin-flash admin-flash--success">{successMessage}</Paragraph>
      ) : null}
      <AdminUsersSearchForm
        action={listPath}
        defaultQuery={query.q}
        defaultRole={query.role ?? ""}
        defaultSubscription={query.subscription ?? ""}
        locale={locale}
        preserveParams={preserveParams}
        resetHref={hasFilters ? listPath : undefined}
      />
      <AdminUsersTable
        listPath={listPath}
        locale={locale}
        members={members}
        query={{
          q: query.q,
          role: query.role,
          subscription: query.subscription,
          creditsMin: query.creditsMin,
          creditsMax: query.creditsMax,
          bookingsMin: query.bookingsMin,
          bookingsMax: query.bookingsMax,
          eventOpensMin: query.eventOpensMin,
          eventOpensMax: query.eventOpensMax,
          createdFrom: query.createdFrom,
          createdTo: query.createdTo,
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
