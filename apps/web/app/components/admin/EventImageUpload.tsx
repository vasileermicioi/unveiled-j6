"use client";

import { Description, Input, Paragraph, Surface } from "@heroui/react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

type EventImageUploadProps = {
  locale: Locale;
  isEdit?: boolean;
  currentImageUrl?: string | null;
};

export function EventImageUpload({
  locale,
  isEdit = false,
  currentImageUrl = null,
}: EventImageUploadProps) {
  const copy = getAdminCopy(locale);

  return (
    <Surface className="flex flex-col gap-4" variant="transparent">
      <Paragraph className="onboarding-form__section-label">{copy.imageFileLabel}</Paragraph>
      <Description>{isEdit ? copy.imageUploadHintEdit : copy.imageUploadHint}</Description>

      {isEdit && currentImageUrl ? (
        <Surface className="admin-form__image-preview" variant="transparent">
          <img alt="" src={currentImageUrl} />
        </Surface>
      ) : null}

      <Input accept="image/jpeg,image/png,image/webp" name="image" required={!isEdit} type="file" />
    </Surface>
  );
}
