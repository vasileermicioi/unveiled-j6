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

type AdminRefundFormProps = {
  locale: Locale;
  userId: string;
  memberLabel: string;
  action: string;
  error?: string | null;
  defaultAmount?: string;
  defaultReason?: string;
};

export function AdminRefundForm({
  locale,
  userId,
  memberLabel,
  action,
  error,
  defaultAmount = "",
  defaultReason = "",
}: AdminRefundFormProps) {
  const copy = getAdminCopy(locale);
  const cancelHref = adminUserDetailPath(locale, userId);

  return (
    <AdminPageShell
      breadcrumbs={[
        { label: copy.usersTitle, href: adminUsersPath(locale) },
        { label: memberLabel, href: cancelHref },
        { label: copy.refundTitle },
      ]}
      title={copy.refundTitle}
    >
      {error ? <AdminFormError message={error} /> : null}
      <Paragraph>{copy.refundBody}</Paragraph>
      <Form action={action} className="flex flex-col gap-4" method="post">
        <TextField defaultValue={defaultAmount} fullWidth isRequired name="amount">
          <Label>{copy.refundAmountLabel}</Label>
          <Input inputMode="numeric" type="text" />
        </TextField>
        <TextField defaultValue={defaultReason} fullWidth isRequired name="description">
          <Label>{copy.refundReasonLabel}</Label>
          <TextArea />
        </TextField>
        <Surface className="flex flex-col gap-3 sm:flex-row sm:items-center" variant="transparent">
          <Button className="button button--primary button--md" type="submit">
            {copy.refundSubmit}
          </Button>
          <Link className="button button--secondary button--md" href={cancelHref}>
            {copy.cancel}
          </Link>
        </Surface>
      </Form>
    </AdminPageShell>
  );
}
