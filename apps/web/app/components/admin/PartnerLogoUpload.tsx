"use client";

import { Description, Input, Paragraph, Surface } from "@heroui/react";
import { ACCEPTED_IMAGE_FILE_ACCEPT } from "@unveiled/images/constants";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

type PartnerLogoUploadProps = {
  locale: Locale;
  isEdit?: boolean;
  currentLogoUrl?: string | null;
};

export function PartnerLogoUpload({
  locale,
  isEdit = false,
  currentLogoUrl = null,
}: PartnerLogoUploadProps) {
  const copy = getAdminCopy(locale);

  return (
    <Surface className="flex flex-col gap-4" variant="transparent">
      <Paragraph className="onboarding-form__section-label">{copy.logoFileLabel}</Paragraph>
      <Description>{isEdit ? copy.logoUploadHintEdit : copy.logoUploadHint}</Description>

      {isEdit && currentLogoUrl ? (
        <Surface className="admin-form__image-preview" variant="transparent">
          <img alt="" src={currentLogoUrl} />
        </Surface>
      ) : null}

      <Input accept={ACCEPTED_IMAGE_FILE_ACCEPT} name="logo" type="file" />
    </Surface>
  );
}
