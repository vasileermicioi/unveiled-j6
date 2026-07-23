import { Link, Paragraph, Surface } from "@heroui/react";
import type { EventGalleryImageRow } from "@unveiled/db";
import { MAX_EVENT_GALLERY_IMAGES } from "@unveiled/db";

import AdminEventGalleryManager from "../../islands/AdminEventGalleryManager";
import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

import { AdminFormError } from "./AdminFormError";
import {
  AdminPageShell,
  adminEventGalleryAddPath,
  adminEventGalleryPath,
  adminEventsPath,
} from "./AdminPageShell";

export type AdminGalleryListItem = EventGalleryImageRow & {
  thumbnailUrl: string | null;
};

type AdminEventGalleryListPageProps = {
  locale: Locale;
  eventId: string;
  eventTitle: string;
  images: AdminGalleryListItem[];
  error?: string | null;
};

export function AdminEventGalleryListPage({
  locale,
  eventId,
  eventTitle,
  images,
  error,
}: AdminEventGalleryListPageProps) {
  const copy = getAdminCopy(locale);
  const listHref = adminEventsPath(locale);
  const addHref = adminEventGalleryAddPath(locale, eventId);
  const galleryHref = adminEventGalleryPath(locale, eventId);

  const managerItems = images.map((image, index) => ({
    imageId: image.imageId,
    thumbnailUrl: image.thumbnailUrl,
    label: copy.galleryPhotoLabel(index + 1),
    selectLabel: copy.gallerySelectLabel(index + 1),
  }));

  return (
    <AdminPageShell
      eyebrow={copy.pageEyebrow}
      actions={
        <Surface className="flex flex-wrap gap-3" variant="transparent">
          <Link className="button button--primary button--md" href={addHref}>
            {copy.galleryAddAction}
          </Link>
        </Surface>
      }
      breadcrumbs={[
        { label: copy.eventsTitle, href: listHref },
        { label: copy.editEventTitle, href: `/${locale}/admin/events/${eventId}/edit` },
        { label: copy.galleryTitle },
      ]}
      subtitle={copy.gallerySubtitle(eventTitle)}
      title={copy.galleryTitle}
    >
      {error ? <AdminFormError message={error} /> : null}
      <Paragraph>{copy.galleryCapacity(images.length, MAX_EVENT_GALLERY_IMAGES)}</Paragraph>

      {images.length === 0 ? (
        <Paragraph>{copy.galleryEmpty}</Paragraph>
      ) : (
        <AdminEventGalleryManager
          copy={{
            removeBulkAction: copy.galleryRemoveBulkAction,
            saveOrderAction: copy.gallerySaveOrderAction,
            reorderHint: copy.galleryReorderHint,
          }}
          eventId={eventId}
          items={managerItems}
          locale={locale}
          reorderAction={galleryHref}
        />
      )}
    </AdminPageShell>
  );
}
