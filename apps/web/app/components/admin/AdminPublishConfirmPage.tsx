import { Button, Form, Link, Paragraph, Surface } from "@heroui/react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

import { AdminFormError } from "./AdminFormError";
import { AdminPageShell } from "./AdminPageShell";

type AdminPublishConfirmPageProps = {
  locale: Locale;
  breadcrumbs: { label: string; href?: string }[];
  title: string;
  body: string;
  action: string;
  submitLabel: string;
  cancelHref: string;
  note?: string | null;
  error?: string | null;
};

export function AdminPublishConfirmPage({
  locale,
  breadcrumbs,
  title,
  body,
  action,
  submitLabel,
  cancelHref,
  note = null,
  error = null,
}: AdminPublishConfirmPageProps) {
  const copy = getAdminCopy(locale);

  return (
    <AdminPageShell breadcrumbs={breadcrumbs} eyebrow={copy.pageEyebrow} title={title}>
      {error ? <AdminFormError message={error} /> : null}
      <Paragraph>{body}</Paragraph>
      {note ? <Paragraph>{note}</Paragraph> : null}
      <Surface className="flex flex-col gap-3 sm:flex-row sm:items-center" variant="transparent">
        <Form action={action} method="post">
          <Button className="button button--primary button--md" type="submit">
            {submitLabel}
          </Button>
        </Form>
        <Link className="button button--secondary button--md" href={cancelHref}>
          {copy.cancel}
        </Link>
      </Surface>
    </AdminPageShell>
  );
}
