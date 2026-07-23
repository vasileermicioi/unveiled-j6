import { Button, Form, Link, Paragraph, Surface } from "@heroui/react";
import type { WaitlistEntry } from "@unveiled/db";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

import { AdminFormError } from "./AdminFormError";
import { AdminPageShell, adminWaitlistPath } from "./AdminPageShell";

type AdminWaitlistPromotePageProps = {
  locale: Locale;
  entry: WaitlistEntry;
  action: string;
  error?: string | null;
};

export function AdminWaitlistPromotePage({
  locale,
  entry,
  action,
  error,
}: AdminWaitlistPromotePageProps) {
  const copy = getAdminCopy(locale);
  const listHref = adminWaitlistPath(locale);

  return (
    <AdminPageShell
      eyebrow={copy.pageEyebrow}
      breadcrumbs={[
        { label: copy.waitlistTitle, href: listHref },
        { label: copy.waitlistPromoteTitle },
      ]}
      title={copy.waitlistPromoteTitle}
    >
      {error ? <AdminFormError message={error} /> : null}
      <Paragraph>{copy.waitlistPromoteBody}</Paragraph>
      <Paragraph color="muted" size="sm">
        {copy.waitlistColUser}: {entry.userId} · {copy.waitlistColEvent}: {entry.eventId} ·{" "}
        {copy.waitlistColStatus}: {entry.status} · {copy.waitlistColQty}: {entry.requestedQty}
      </Paragraph>
      <Surface className="flex flex-col gap-3 sm:flex-row sm:items-center" variant="transparent">
        <Form action={action} method="post">
          <Button className="button button--primary button--md" type="submit">
            {copy.waitlistPromoteSubmit}
          </Button>
        </Form>
        <Link className="button button--secondary button--md" href={listHref}>
          {copy.cancel}
        </Link>
      </Surface>
    </AdminPageShell>
  );
}
