import { Button, Form, Label, Link, Paragraph, Surface } from "@heroui/react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

import { AdminFormError } from "./AdminFormError";
import { AdminPageShell, adminBookingsPath, adminEventBookingsPath } from "./AdminPageShell";

type AdminCancelAllBookingsPageProps = {
  locale: Locale;
  eventId: string;
  eventTitle: string;
  action: string;
  confirmedCount: number;
  refundableCredits: number;
  compConfirmedCount: number;
  usedCount: number;
  waitingCount: number;
  error?: string | null;
  defaultReason?: string;
};

export function AdminCancelAllBookingsPage({
  locale,
  eventId,
  eventTitle,
  action,
  confirmedCount,
  refundableCredits,
  compConfirmedCount,
  usedCount,
  waitingCount,
  error,
  defaultReason = "",
}: AdminCancelAllBookingsPageProps) {
  const copy = getAdminCopy(locale);
  const listHref = adminEventBookingsPath(locale, eventId);
  const canSubmit = confirmedCount > 0;

  return (
    <AdminPageShell
      eyebrow={copy.pageEyebrow}
      breadcrumbs={[
        { label: copy.bookingsIndexTitle, href: adminBookingsPath(locale) },
        { label: eventTitle, href: listHref },
        { label: copy.cancelAllTitle },
      ]}
      title={copy.cancelAllTitle}
    >
      {error ? <AdminFormError message={error} /> : null}
      <Paragraph>{copy.cancelAllLead}</Paragraph>
      <Paragraph>{copy.cancelAllCatalogWarning}</Paragraph>
      <Paragraph>{copy.cancelAllSinglePathNote}</Paragraph>
      <Paragraph>{copy.cancelAllUsedNote}</Paragraph>
      <Surface className="flex flex-col gap-2" variant="transparent">
        <Paragraph>
          {copy.colConfirmed}: {confirmedCount}
        </Paragraph>
        <Paragraph>
          {copy.colCreditsCharged}: {refundableCredits}
        </Paragraph>
        <Paragraph>
          {copy.colConfirmed} · {copy.colCreditsCharged} 0: {compConfirmedCount}
        </Paragraph>
        <Paragraph>
          {copy.colUsed}: {usedCount}
        </Paragraph>
        <Paragraph>
          {copy.colWaitlist}: {waitingCount}
        </Paragraph>
      </Surface>
      {canSubmit ? (
        <Form action={action} className="flex flex-col gap-4" method="post">
          <Surface className="flex w-full flex-col gap-1" variant="transparent">
            <Label htmlFor="cancel-all-reason">{copy.cancelAllReasonLabel}</Label>
            <textarea
              className="admin-native-textarea"
              defaultValue={defaultReason}
              id="cancel-all-reason"
              name="reason"
              required
              rows={4}
            />
          </Surface>
          <Surface
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
            variant="transparent"
          >
            <Button className="button button--primary button--md" type="submit">
              {copy.cancelAllSubmit}
            </Button>
            <Link className="button button--secondary button--md" href={listHref}>
              {copy.cancel}
            </Link>
          </Surface>
        </Form>
      ) : (
        <Surface className="flex flex-col gap-3" variant="transparent">
          <Paragraph color="muted">{copy.cancelAllEmpty}</Paragraph>
          <Link className="button button--secondary button--md" href={listHref}>
            {copy.cancel}
          </Link>
        </Surface>
      )}
    </AdminPageShell>
  );
}
