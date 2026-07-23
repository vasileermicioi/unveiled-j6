import { Button, Form, Link, Paragraph, Surface } from "@heroui/react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

import type { AdminGalleryListItem } from "./AdminEventGalleryListPage";
import { AdminFormError } from "./AdminFormError";
import {
  AdminPageShell,
  adminEventGalleryPath,
  adminEventGalleryRemovePath,
  adminEventsPath,
} from "./AdminPageShell";

type AdminEventGalleryRemovePageProps = {
  locale: Locale;
  eventId: string;
  eventTitle: string;
  images: AdminGalleryListItem[];
  selectedImageIds: string[];
  error?: string | null;
};

export function AdminEventGalleryRemovePage({
  locale,
  eventId,
  eventTitle,
  images,
  selectedImageIds,
  error,
}: AdminEventGalleryRemovePageProps) {
  const copy = getAdminCopy(locale);
  const galleryHref = adminEventGalleryPath(locale, eventId);
  const selectedSet = new Set(selectedImageIds);
  const selectedImages = images.filter((image) => selectedSet.has(image.imageId));

  return (
    <AdminPageShell
      eyebrow={copy.pageEyebrow}
      breadcrumbs={[
        { label: copy.eventsTitle, href: adminEventsPath(locale) },
        { label: copy.editEventTitle, href: `/${locale}/admin/events/${eventId}/edit` },
        { label: copy.galleryTitle, href: galleryHref },
        { label: copy.galleryRemoveTitle },
      ]}
      subtitle={copy.gallerySubtitle(eventTitle)}
      title={copy.galleryRemoveTitle}
    >
      {error ? <AdminFormError message={error} /> : null}
      <Paragraph>{copy.galleryRemoveBody}</Paragraph>

      {selectedImages.length > 0 ? (
        <Surface className="admin-event-gallery__confirm-grid" variant="transparent">
          {selectedImages.map((image, index) =>
            image.thumbnailUrl ? (
              <Surface
                className="admin-event-gallery__confirm-tile"
                key={image.imageId}
                variant="transparent"
              >
                <img
                  alt={copy.galleryPhotoLabel(index + 1)}
                  className="admin-event-gallery__thumb"
                  src={image.thumbnailUrl}
                />
              </Surface>
            ) : (
              <Paragraph key={image.imageId}>{copy.galleryPhotoLabel(index + 1)}</Paragraph>
            ),
          )}
        </Surface>
      ) : null}

      <Form
        action={adminEventGalleryRemovePath(locale, eventId)}
        className="flex flex-col gap-4"
        method="post"
      >
        {selectedImageIds.map((imageId) => (
          <input key={imageId} name="imageIds" type="hidden" value={imageId} />
        ))}
        <Surface className="flex flex-col gap-3 sm:flex-row sm:items-center" variant="transparent">
          <Button className="button button--primary button--md" type="submit">
            {copy.galleryRemoveConfirm}
          </Button>
          <Link className="button button--secondary button--md" href={galleryHref}>
            {copy.cancel}
          </Link>
        </Surface>
      </Form>
    </AdminPageShell>
  );
}
