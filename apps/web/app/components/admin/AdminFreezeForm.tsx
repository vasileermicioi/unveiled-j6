import { Button, Form, Link, Paragraph, Surface } from "@heroui/react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

import { AdminFormError } from "./AdminFormError";
import { AdminPageShell, adminUserDetailPath, adminUsersPath } from "./AdminPageShell";

export type FreezeAction = "freeze" | "unfreeze" | "unavailable";

type AdminFreezeFormProps = {
  locale: Locale;
  userId: string;
  memberLabel: string;
  action: string;
  freezeAction: FreezeAction;
  error?: string | null;
};

export function AdminFreezeForm({
  locale,
  userId,
  memberLabel,
  action,
  freezeAction,
  error,
}: AdminFreezeFormProps) {
  const copy = getAdminCopy(locale);
  const cancelHref = adminUserDetailPath(locale, userId);
  const title = freezeAction === "unfreeze" ? copy.unfreezeTitle : copy.freezeTitle;
  const body =
    freezeAction === "unfreeze"
      ? copy.unfreezeBody(memberLabel)
      : freezeAction === "freeze"
        ? copy.freezeBody(memberLabel)
        : copy.freezeUnavailable;
  const submitLabel = freezeAction === "unfreeze" ? copy.unfreezeSubmit : copy.freezeSubmit;

  return (
    <AdminPageShell
      breadcrumbs={[
        { label: copy.usersTitle, href: adminUsersPath(locale) },
        { label: memberLabel, href: cancelHref },
        { label: title },
      ]}
      title={title}
    >
      {error ? <AdminFormError message={error} /> : null}
      <Paragraph>{body}</Paragraph>
      {freezeAction === "unavailable" ? (
        <Link className="button button--secondary button--md" href={cancelHref}>
          {copy.cancel}
        </Link>
      ) : (
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
      )}
    </AdminPageShell>
  );
}
