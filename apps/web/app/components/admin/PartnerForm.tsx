"use client";

import {
  Button,
  Description,
  Form,
  Input,
  InputGroup,
  Label,
  Link,
  Paragraph,
  Surface,
  TextField,
} from "@heroui/react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

export type PartnerFormDefaults = {
  name?: string;
  contactEmail?: string;
  address?: string;
  logoUrl?: string;
};

type PartnerFormProps = {
  locale: Locale;
  action: string;
  submitLabel: string;
  cancelHref: string;
  defaults?: PartnerFormDefaults;
  error?: string | null;
};

export function PartnerForm({
  locale,
  action,
  submitLabel,
  cancelHref,
  defaults,
  error = null,
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

      <InputGroup fullWidth>
        <Label>{copy.addressLabel}</Label>
        <InputGroup.TextArea defaultValue={defaults?.address} name="address" rows={3} />
      </InputGroup>

      <Surface className="flex flex-col gap-4" variant="transparent">
        <Paragraph className="onboarding-form__section-label">{copy.logoFileLabel}</Paragraph>
        <Description>{copy.logoUrlHint}</Description>
        <Input accept="image/jpeg,image/png,image/webp" name="logo" type="file" />
        <TextField defaultValue={defaults?.logoUrl} fullWidth name="logo_url">
          <Label>{copy.logoUrlLabel}</Label>
          <Input type="url" />
        </TextField>
      </Surface>

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
