import { Button, Form, Label, Link, Paragraph, Surface, TextArea, TextField } from "@heroui/react";
import type { Booking } from "@unveiled/db";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

import { AdminFormError } from "./AdminFormError";
import { AdminPageShell, adminUserDetailPath, adminUsersPath } from "./AdminPageShell";

type AdminCancelBookingPageProps = {
  locale: Locale;
  booking: Booking;
  eventTitle: string;
  action: string;
  error?: string | null;
  defaultReason?: string;
};

export function AdminCancelBookingPage({
  locale,
  booking,
  eventTitle,
  action,
  error,
  defaultReason = "",
}: AdminCancelBookingPageProps) {
  const copy = getAdminCopy(locale);
  const memberHref = adminUserDetailPath(locale, booking.userId);

  return (
    <AdminPageShell
      eyebrow={copy.pageEyebrow}
      breadcrumbs={[
        { label: copy.usersTitle, href: adminUsersPath(locale) },
        { label: booking.userId, href: memberHref },
        { label: copy.cancelBookingTitle },
      ]}
      title={copy.cancelBookingTitle}
    >
      {error ? <AdminFormError message={error} /> : null}
      <Paragraph>{copy.cancelBookingBody(eventTitle)}</Paragraph>
      {booking.status !== "CONFIRMED" ? (
        <Paragraph color="muted">{copy.cancelBookingNotConfirmed}</Paragraph>
      ) : null}
      <Form action={action} className="flex flex-col gap-4" method="post">
        <TextField defaultValue={defaultReason} fullWidth isRequired name="reason">
          <Label>{copy.cancelBookingReasonLabel}</Label>
          <TextArea />
        </TextField>
        <Surface className="flex flex-col gap-3 sm:flex-row sm:items-center" variant="transparent">
          <Button
            className="button button--primary button--md"
            isDisabled={booking.status !== "CONFIRMED"}
            type="submit"
          >
            {copy.cancelBookingSubmit}
          </Button>
          <Link className="button button--secondary button--md" href={memberHref}>
            {copy.cancel}
          </Link>
        </Surface>
      </Form>
    </AdminPageShell>
  );
}
