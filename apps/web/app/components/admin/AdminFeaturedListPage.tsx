import { Link, Paragraph, Surface } from "@heroui/react";
import type { FeaturedEventRow } from "@unveiled/db";

import AdminFeaturedEventsManager from "../../islands/AdminFeaturedEventsManager";
import { getAdminCopy } from "../../lib/admin-content";
import { formatEventDateTimeWithCount } from "../../lib/admin-event-form";
import type { Locale } from "../../lib/locale";

import { AdminFormError } from "./AdminFormError";
import { AdminPageShell } from "./AdminPageShell";
import { adminEventPreviewPath, adminFeaturedAddPath, adminFeaturedPath } from "./admin-tabs";

type AdminFeaturedListPageProps = {
  locale: Locale;
  events: FeaturedEventRow[];
  imageUrls: Record<string, string | undefined>;
  error?: string | null;
  successMessage?: string | null;
};

export function AdminFeaturedListPage({
  locale,
  events,
  imageUrls,
  error,
  successMessage = null,
}: AdminFeaturedListPageProps) {
  const copy = getAdminCopy(locale);
  const listHref = adminFeaturedPath(locale);

  const managerItems = events.map((event) => ({
    eventId: event.id,
    title: event.title,
    partnerName: event.partnerName,
    dateLabel: formatEventDateTimeWithCount(event.dateTime, locale, event.dateTimes?.length ?? 1),
    thumbnailUrl: imageUrls[event.id] ?? null,
    selectLabel: copy.featuredSelectLabel(event.title),
    previewHref: adminEventPreviewPath(locale, event.id),
    previewLabel: copy.previewAction,
  }));

  return (
    <AdminPageShell
      eyebrow={copy.pageEyebrow}
      actions={
        <Surface className="flex flex-wrap gap-3" variant="transparent">
          <Link className="button button--primary button--md" href={adminFeaturedAddPath(locale)}>
            {copy.featuredAddAction}
          </Link>
        </Surface>
      }
      subtitle={copy.featuredSubtitle}
      title={copy.featuredTitle}
    >
      {successMessage ? (
        <Paragraph className="admin-flash admin-flash--success">{successMessage}</Paragraph>
      ) : null}
      {error ? <AdminFormError message={error} /> : null}

      {events.length === 0 ? (
        <Paragraph color="muted">{copy.featuredEmpty}</Paragraph>
      ) : (
        <AdminFeaturedEventsManager
          copy={{
            reorderHint: copy.featuredReorderHint,
            saveOrderAction: copy.featuredSaveOrderAction,
            removeBulkAction: copy.featuredRemoveBulkAction,
            listLabel: copy.featuredTitle,
            tableLogo: copy.tableLogo,
            tableTitle: copy.tableTitle,
            tablePartner: copy.tablePartner,
            tableDate: copy.tableDate,
            imagePlaceholderLabel: copy.imagePlaceholderLabel,
          }}
          items={managerItems}
          locale={locale}
          reorderAction={listHref}
        />
      )}
    </AdminPageShell>
  );
}
