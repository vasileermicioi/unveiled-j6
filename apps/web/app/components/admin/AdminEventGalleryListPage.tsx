import { Link, Paragraph, Surface } from "@heroui/react";
import type { EventGalleryImageRow } from "@unveiled/db";
import { MAX_EVENT_GALLERY_IMAGES } from "@unveiled/db";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

import {
  AdminPageShell,
  adminEventGalleryAddPath,
  adminEventGalleryRemovePath,
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
};

export function AdminEventGalleryListPage({
  locale,
  eventId,
  eventTitle,
  images,
}: AdminEventGalleryListPageProps) {
  const copy = getAdminCopy(locale);
  const listHref = adminEventsPath(locale);
  const addHref = adminEventGalleryAddPath(locale, eventId);
  const removeHref = adminEventGalleryRemovePath(locale, eventId);

  return (
    <AdminPageShell
      actions={
        <Surface className="flex flex-wrap gap-3" variant="transparent">
          <Link className="button button--primary button--md" href={addHref}>
            {copy.galleryAddAction}
          </Link>
          {images.length > 0 ? (
            <Link className="button button--secondary button--md" href={removeHref}>
              {copy.galleryRemoveBulkAction}
            </Link>
          ) : null}
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
      <Paragraph>{copy.galleryCapacity(images.length, MAX_EVENT_GALLERY_IMAGES)}</Paragraph>

      {images.length === 0 ? (
        <Paragraph>{copy.galleryEmpty}</Paragraph>
      ) : (
        <Surface className="flex flex-col gap-4" variant="transparent">
          {images.map((image, index) => (
            <Surface
              className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              key={image.imageId}
              variant="default"
            >
              <Surface className="flex items-center gap-3" variant="transparent">
                {image.thumbnailUrl ? (
                  <Surface className="admin-form__image-preview" variant="transparent">
                    <img alt="" src={image.thumbnailUrl} />
                  </Surface>
                ) : null}
                <Paragraph>{copy.galleryPhotoLabel(index + 1, image.sortOrder)}</Paragraph>
              </Surface>
              <Link
                className="button button--secondary button--sm"
                href={adminEventGalleryRemovePath(locale, eventId, [image.imageId])}
              >
                {copy.galleryRemoveAction}
              </Link>
            </Surface>
          ))}
        </Surface>
      )}
    </AdminPageShell>
  );
}
