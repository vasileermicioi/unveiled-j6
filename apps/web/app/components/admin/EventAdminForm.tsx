"use client";

import { Button, Form, Link, Paragraph, Surface } from "@heroui/react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

import { EventAdminBaseFields } from "./EventAdminBaseFields";
import type { EventFormDefaults, PartnerOption } from "./event-admin-types";

type EventAdminFormProps = {
  locale: Locale;
  action: string;
  submitLabel: string;
  cancelHref: string;
  partners: PartnerOption[];
  defaults?: EventFormDefaults;
  error?: string | null;
  isEdit?: boolean;
};

export function EventAdminForm({
  locale,
  action,
  submitLabel,
  cancelHref,
  partners,
  defaults,
  error = null,
  isEdit = false,
}: EventAdminFormProps) {
  const copy = getAdminCopy(locale);

  return (
    <Form
      action={action}
      className="admin-form flex flex-col gap-6"
      encType="multipart/form-data"
      method="post"
    >
      {error ? <Paragraph>{error}</Paragraph> : null}
      <EventAdminBaseFields
        defaults={defaults}
        includeDateTime
        isEdit={isEdit}
        locale={locale}
        partners={partners}
      />
      <Surface className="flex flex-col gap-3 sm:flex-row sm:items-center" variant="transparent">
        <Button className="button button--primary button--md sm:min-w-40" type="submit">
          {submitLabel}
        </Button>
        <Link className="button button--secondary button--md sm:min-w-40" href={cancelHref}>
          {copy.cancel}
        </Link>
      </Surface>
    </Form>
  );
}

export function eventListPath(locale: Locale): string {
  return localizedPath(locale, "admin/events");
}

export type { EventFormDefaults, PartnerOption } from "./event-admin-types";
