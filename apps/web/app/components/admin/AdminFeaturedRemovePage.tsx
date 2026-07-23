import { Button, Form, Link, Paragraph, Surface } from "@heroui/react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

import { AdminFormError } from "./AdminFormError";
import { AdminPageShell, adminFeaturedPath, adminFeaturedRemovePath } from "./AdminPageShell";

type AdminFeaturedRemovePageProps = {
  locale: Locale;
  eventId: string;
  eventTitle: string;
  eventDate: string;
  error?: string | null;
};

export function AdminFeaturedRemovePage({
  locale,
  eventId,
  eventTitle,
  eventDate,
  error,
}: AdminFeaturedRemovePageProps) {
  const copy = getAdminCopy(locale);
  const listHref = adminFeaturedPath(locale);

  return (
    <AdminPageShell
      eyebrow={copy.pageEyebrow}
      breadcrumbs={[
        { label: copy.featuredTitle, href: listHref },
        { label: copy.featuredRemoveTitle },
      ]}
      title={copy.featuredRemoveTitle}
    >
      {error ? <AdminFormError message={error} /> : null}
      <Paragraph>{copy.featuredRemoveBody(eventTitle, eventDate)}</Paragraph>
      <Surface className="flex flex-col gap-3 sm:flex-row sm:items-center" variant="transparent">
        <Form action={adminFeaturedRemovePath(locale, eventId)} method="post">
          <Button className="button button--primary button--md" type="submit">
            {copy.featuredRemoveConfirm}
          </Button>
        </Form>
        <Link className="button button--secondary button--md" href={listHref}>
          {copy.cancel}
        </Link>
      </Surface>
    </AdminPageShell>
  );
}
