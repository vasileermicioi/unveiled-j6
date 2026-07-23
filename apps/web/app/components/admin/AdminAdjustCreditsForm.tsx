import {
  Button,
  Form,
  Input,
  Label,
  Link,
  Paragraph,
  Surface,
  TextArea,
  TextField,
} from "@heroui/react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

import { AdminFormError } from "./AdminFormError";
import { AdminPageShell, adminUserDetailPath, adminUsersPath } from "./AdminPageShell";

type AdminAdjustCreditsFormProps = {
  locale: Locale;
  userId: string;
  memberLabel: string;
  action: string;
  error?: string | null;
  defaultAmount?: string;
  defaultReason?: string;
};

export function AdminAdjustCreditsForm({
  locale,
  userId,
  memberLabel,
  action,
  error,
  defaultAmount = "",
  defaultReason = "",
}: AdminAdjustCreditsFormProps) {
  const copy = getAdminCopy(locale);
  const cancelHref = adminUserDetailPath(locale, userId);

  return (
    <AdminPageShell
      eyebrow={copy.pageEyebrow}
      breadcrumbs={[
        { label: copy.usersTitle, href: adminUsersPath(locale) },
        { label: memberLabel, href: cancelHref },
        { label: copy.adjustCreditsTitle },
      ]}
      title={copy.adjustCreditsTitle}
    >
      {error ? <AdminFormError message={error} /> : null}
      <Paragraph>{copy.adjustCreditsBody}</Paragraph>
      <Form action={action} className="flex flex-col gap-4" method="post">
        <TextField defaultValue={defaultAmount} fullWidth isRequired name="amount">
          <Label>{copy.adjustCreditsAmountLabel}</Label>
          <Input inputMode="numeric" type="text" />
        </TextField>
        <TextField defaultValue={defaultReason} fullWidth isRequired name="description">
          <Label>{copy.adjustCreditsReasonLabel}</Label>
          <TextArea />
        </TextField>
        <Surface className="flex flex-col gap-3 sm:flex-row sm:items-center" variant="transparent">
          <Button className="button button--primary button--md" type="submit">
            {copy.adjustCreditsSubmit}
          </Button>
          <Link className="button button--secondary button--md" href={cancelHref}>
            {copy.cancel}
          </Link>
        </Surface>
      </Form>
    </AdminPageShell>
  );
}
