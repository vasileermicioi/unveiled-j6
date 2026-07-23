import { Button, Form, Link, Surface } from "@heroui/react";
import EventImageUpload from "../../islands/EventImageUpload";
import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

import { AdminFormError } from "./AdminFormError";
import {
  AdminPageShell,
  adminEventGalleryAddPath,
  adminEventGalleryPath,
  adminEventsPath,
} from "./AdminPageShell";

type AdminEventGalleryAddPageProps = {
  locale: Locale;
  eventId: string;
  eventTitle: string;
  remainingSlots: number;
  error?: string | null;
};

export function AdminEventGalleryAddPage({
  locale,
  eventId,
  eventTitle,
  remainingSlots,
  error,
}: AdminEventGalleryAddPageProps) {
  const copy = getAdminCopy(locale);
  const galleryHref = adminEventGalleryPath(locale, eventId);

  return (
    <AdminPageShell
      eyebrow={copy.pageEyebrow}
      breadcrumbs={[
        { label: copy.eventsTitle, href: adminEventsPath(locale) },
        { label: copy.editEventTitle, href: `/${locale}/admin/events/${eventId}/edit` },
        { label: copy.galleryTitle, href: galleryHref },
        { label: copy.galleryAddTitle },
      ]}
      subtitle={copy.gallerySubtitle(eventTitle)}
      title={copy.galleryAddTitle}
    >
      {error ? <AdminFormError message={error} /> : null}
      <Form
        action={adminEventGalleryAddPath(locale, eventId)}
        className="flex flex-col gap-6"
        encType="multipart/form-data"
        method="post"
      >
        <EventImageUpload
          locale={locale}
          multiple
          sectionLabel={copy.galleryAddTitle}
          uploadHint={copy.galleryAddSubtitle(remainingSlots)}
        />
        <Surface className="flex flex-col gap-3 sm:flex-row sm:items-center" variant="transparent">
          <Button className="button button--primary button--md" type="submit">
            {copy.galleryAddSubmit}
          </Button>
          <Link className="button button--secondary button--md" href={galleryHref}>
            {copy.cancel}
          </Link>
        </Surface>
      </Form>
    </AdminPageShell>
  );
}
