import { Button, Description, Form, Link, Paragraph, Surface } from "@heroui/react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

import type { AdminGalleryListItem } from "./AdminEventGalleryListPage";
import { AdminFormError } from "./AdminFormError";
import { AdminFormSelect } from "./AdminFormSelect";
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
  defaultSelectedKeys?: string[];
  error?: string | null;
};

export function AdminEventGalleryRemovePage({
  locale,
  eventId,
  eventTitle,
  images,
  defaultSelectedKeys = [],
  error,
}: AdminEventGalleryRemovePageProps) {
  const copy = getAdminCopy(locale);
  const galleryHref = adminEventGalleryPath(locale, eventId);

  return (
    <AdminPageShell
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

      {images.length > 0 ? (
        <Surface className="flex flex-wrap gap-3" variant="transparent">
          {images.map((image, index) =>
            image.thumbnailUrl ? (
              <Surface
                className="admin-form__image-preview"
                key={image.imageId}
                variant="transparent"
              >
                <img
                  alt={copy.galleryPhotoLabel(index + 1, image.sortOrder)}
                  src={image.thumbnailUrl}
                />
              </Surface>
            ) : null,
          )}
        </Surface>
      ) : null}

      <Form
        action={adminEventGalleryRemovePath(locale, eventId)}
        className="flex flex-col gap-4"
        method="post"
      >
        <AdminFormSelect
          defaultSelectedKeys={defaultSelectedKeys}
          label={copy.galleryRemoveSelectLabel}
          name="imageIds"
          options={images.map((image, index) => ({
            id: image.imageId,
            label: copy.galleryPhotoLabel(index + 1, image.sortOrder),
          }))}
          selectionMode="multiple"
        />
        <Description>{copy.galleryRemoveSelectHint}</Description>
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
