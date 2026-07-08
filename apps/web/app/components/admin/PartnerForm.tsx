"use client";

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
import { localizedPath } from "../../lib/locale";

import { PartnerLogoUpload } from "./PartnerLogoUpload";

export type PartnerFormDefaults = {
  name?: string;
  contactEmail?: string;
  address?: string;
  currentLogoUrl?: string | null;
};

type PartnerFormProps = {
  locale: Locale;
  action: string;
  submitLabel: string;
  cancelHref: string;
  defaults?: PartnerFormDefaults;
  error?: string | null;
  isEdit?: boolean;
};

export function PartnerForm({
  locale,
  action,
  submitLabel,
  cancelHref,
  defaults,
  error = null,
  isEdit = false,
}: PartnerFormProps) {
  const copy = getAdminCopy(locale);

  return (
    <Form
      action={action}
      className="admin-form flex flex-col gap-6"
      encType="multipart/form-data"
      method="post"
    >
      {error ? <Paragraph>{error}</Paragraph> : null}

      <TextField defaultValue={defaults?.name} fullWidth isRequired name="name">
        <Label>{copy.nameLabel}</Label>
        <Input />
      </TextField>

      <TextField defaultValue={defaults?.contactEmail} fullWidth isRequired name="contact_email">
        <Label>{copy.emailLabel}</Label>
        <Input type="email" />
      </TextField>

      <TextField defaultValue={defaults?.address} fullWidth isRequired name="address">
        <Label>{copy.addressLabel}</Label>
        <TextArea rows={3} />
      </TextField>

      <PartnerLogoUpload
        currentLogoUrl={defaults?.currentLogoUrl}
        isEdit={isEdit}
        locale={locale}
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

export function partnerListPath(locale: Locale): string {
  return localizedPath(locale, "admin/partners");
}
