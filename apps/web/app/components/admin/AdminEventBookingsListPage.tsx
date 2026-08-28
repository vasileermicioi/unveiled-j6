import { Button, Form, Link, Paragraph } from "@heroui/react";
import type { EventBookingListItem } from "@unveiled/db";

import { getAdminCopy } from "../../lib/admin-content";
import { buildAdminEventBookingsListQueryString } from "../../lib/admin-list";
import type { Locale } from "../../lib/locale";

import { AdminEventBookingsTable } from "./AdminEventBookingsTable";
import { AdminFormSelect } from "./AdminFormSelect";
import {
  AdminPageShell,
  adminBookingsPath,
  adminEventBookingsCancelAllPath,
  adminEventBookingsPath,
} from "./AdminPageShell";
import { AdminPagination } from "./AdminPagination";

type AdminEventBookingsListPageProps = {
  locale: Locale;
  eventId: string;
  eventTitle: string;
  items: EventBookingListItem[];
  total: number;
  page: number;
  pageSize: number;
  status?: string;
  confirmedCount: number;
  successMessage?: string | null;
};

export function AdminEventBookingsListPage({
  locale,
  eventId,
  eventTitle,
  items,
  total,
  page,
  pageSize,
  status = "",
  confirmedCount,
  successMessage = null,
}: AdminEventBookingsListPageProps) {
  const copy = getAdminCopy(locale);
  const listPath = adminEventBookingsPath(locale, eventId);
  const queryString = buildAdminEventBookingsListQueryString({
    status: status || undefined,
    page,
  });

  return (
    <AdminPageShell
      eyebrow={copy.pageEyebrow}
      actions={
        confirmedCount > 0 ? (
          <Link
            className="button button--secondary button--md"
            href={adminEventBookingsCancelAllPath(locale, eventId)}
          >
            {copy.cancelAllAction}
          </Link>
        ) : undefined
      }
      breadcrumbs={[
        { label: copy.bookingsIndexTitle, href: adminBookingsPath(locale) },
        { label: eventTitle },
      ]}
      subtitle={eventTitle}
      title={copy.eventBookingsTitle}
    >
      {successMessage ? (
        <Paragraph className="admin-flash admin-flash--success">{successMessage}</Paragraph>
      ) : null}
      <Form action={listPath} className="flex flex-col gap-3 sm:flex-row sm:items-end" method="get">
        <AdminFormSelect
          defaultSelectedKey={status}
          label={copy.statusFilterLabel}
          name="status"
          options={[
            { id: "CONFIRMED", label: copy.colConfirmed },
            { id: "USED", label: copy.colUsed },
            { id: "CANCELLED", label: copy.colCancelled },
            { id: "WAITLIST", label: copy.colWaitlist },
          ]}
          placeholder={copy.waitlistStatusAll}
        />
        <Button className="button button--secondary button--md" type="submit">
          {copy.searchSubmit}
        </Button>
      </Form>
      <AdminEventBookingsTable items={items} locale={locale} />
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
