"use client";

import { Button, Form, Input, Label, TextField } from "@heroui/react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

import { AdminFormSelect } from "./AdminFormSelect";

type AdminWaitlistSearchFormProps = {
  locale: Locale;
  action: string;
  defaultEventId?: string;
  defaultStatus?: string;
};

export function AdminWaitlistSearchForm({
  locale,
  action,
  defaultEventId = "",
  defaultStatus = "",
}: AdminWaitlistSearchFormProps) {
  const copy = getAdminCopy(locale);

  return (
    <Form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end" method="get">
      <TextField
        className="w-full sm:max-w-md"
        defaultValue={defaultEventId}
        fullWidth
        name="eventId"
      >
        <Label htmlFor="admin-waitlist-event">{copy.waitlistEventIdLabel}</Label>
        <Input id="admin-waitlist-event" placeholder={copy.waitlistEventIdLabel} type="text" />
      </TextField>
      <AdminFormSelect
        defaultSelectedKey={defaultStatus || "__all__"}
        label={copy.waitlistStatusLabel}
        name="status"
        options={[
          { id: "__all__", label: copy.waitlistStatusAll },
          { id: "WAITING", label: copy.waitlistStatusWaiting },
          { id: "PROMOTED", label: copy.waitlistStatusPromoted },
          { id: "CANCELLED", label: copy.waitlistStatusCancelled },
        ]}
        placeholder={copy.waitlistStatusAll}
      />
      <Button className="button button--secondary button--md" type="submit">
        {copy.searchSubmit}
      </Button>
    </Form>
  );
}
