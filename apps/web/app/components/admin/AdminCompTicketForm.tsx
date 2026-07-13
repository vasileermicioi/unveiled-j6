"use client";

import { Button, Form, Input, Label, Link, Paragraph, Surface, TextField } from "@heroui/react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

import { AdminFormError } from "./AdminFormError";
import { AdminFormSelect } from "./AdminFormSelect";
import { AdminPageShell, adminUserDetailPath, adminUsersPath } from "./AdminPageShell";

export type CompTicketEventOption = {
  id: string;
  label: string;
};

type AdminCompTicketFormProps = {
  locale: Locale;
  userId: string;
  memberLabel: string;
  action: string;
  events: CompTicketEventOption[];
  error?: string | null;
  defaultEventId?: string;
  defaultTickets?: string;
};

export function AdminCompTicketForm({
  locale,
  userId,
  memberLabel,
  action,
  events,
  error,
  defaultEventId = "",
  defaultTickets = "1",
}: AdminCompTicketFormProps) {
  const copy = getAdminCopy(locale);
  const cancelHref = adminUserDetailPath(locale, userId);

  return (
    <AdminPageShell
      breadcrumbs={[
        { label: copy.usersTitle, href: adminUsersPath(locale) },
        { label: memberLabel, href: cancelHref },
        { label: copy.compTicketTitle },
      ]}
      title={copy.compTicketTitle}
    >
      {error ? <AdminFormError message={error} /> : null}
      <Paragraph>{copy.compTicketBody}</Paragraph>
      {events.length === 0 ? (
        <Paragraph color="muted">{copy.compTicketNoEvents}</Paragraph>
      ) : (
        <Form action={action} className="flex flex-col gap-4" method="post">
          <AdminFormSelect
            defaultSelectedKey={defaultEventId || events[0]?.id}
            isRequired
            label={copy.compTicketEventLabel}
            name="eventId"
            options={events}
            placeholder={copy.selectPlaceholder}
          />
          <TextField defaultValue={defaultTickets} fullWidth name="ticketsCount">
            <Label>{copy.compTicketTicketsLabel}</Label>
            <Input inputMode="numeric" type="text" />
          </TextField>
          <Surface
            className="flex flex-col gap-3 sm:flex-row sm:items-center"
            variant="transparent"
          >
            <Button className="button button--primary button--md" type="submit">
              {copy.compTicketSubmit}
            </Button>
            <Link className="button button--secondary button--md" href={cancelHref}>
              {copy.cancel}
            </Link>
          </Surface>
        </Form>
      )}
      {events.length === 0 ? (
        <Link className="button button--secondary button--md" href={cancelHref}>
          {copy.cancel}
        </Link>
      ) : null}
    </AdminPageShell>
  );
}
