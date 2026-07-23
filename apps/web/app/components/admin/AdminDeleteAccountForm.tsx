import { Button, Form, Link, Paragraph, Surface } from "@heroui/react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

import { AdminFormError } from "./AdminFormError";
import { AdminPageShell, adminUserDetailPath, adminUsersPath } from "./AdminPageShell";

type AdminDeleteAccountFormProps = {
  locale: Locale;
  userId: string;
  memberLabel: string;
  action: string;
  error?: string | null;
};

export function AdminDeleteAccountForm({
  locale,
  userId,
  memberLabel,
  action,
  error,
}: AdminDeleteAccountFormProps) {
  const copy = getAdminCopy(locale);
  const cancelHref = adminUserDetailPath(locale, userId);

  return (
    <AdminPageShell
      eyebrow={copy.pageEyebrow}
      breadcrumbs={[
        { label: copy.usersTitle, href: adminUsersPath(locale) },
        { label: memberLabel, href: cancelHref },
        { label: copy.deleteAccountTitle },
      ]}
      title={copy.deleteAccountTitle}
    >
      {error ? <AdminFormError message={error} /> : null}
      <Paragraph>{copy.deleteAccountBody(memberLabel)}</Paragraph>
      <Surface className="flex flex-col gap-3 sm:flex-row sm:items-center" variant="transparent">
        <Form action={action} method="post">
          <Button className="button button--primary button--md" type="submit">
            {copy.deleteAccountSubmit}
          </Button>
        </Form>
        <Link className="button button--secondary button--md" href={cancelHref}>
          {copy.cancel}
        </Link>
      </Surface>
    </AdminPageShell>
  );
}
