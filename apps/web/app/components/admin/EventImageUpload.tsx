"use client";

import { Description, Input, Label, Paragraph, Surface, TextField } from "@heroui/react";
import { ACCEPTED_IMAGE_FILE_ACCEPT } from "@unveiled/images";

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
      <Paragraph className="onboarding-form__section-label">{copy.imageSectionLabel}</Paragraph>
      <Description>{isEdit ? copy.imageUploadHintEdit : copy.imageUploadHint}</Description>

      {isEdit && currentImageUrl ? (
        <Surface className="admin-form__image-preview" variant="transparent">
          <img alt="" src={currentImageUrl} />
        </Surface>
      ) : null}

      <Surface className="flex flex-col gap-2" variant="transparent">
        <Label htmlFor="event-image-file">{copy.imageFileLabel}</Label>
        {/* Server enforces upload XOR URL; omit HTML required so URL-only create works. */}
        <Input accept={ACCEPTED_IMAGE_FILE_ACCEPT} id="event-image-file" name="image" type="file" />
      </Surface>

      <TextField fullWidth name="image_url">
        <Label>{copy.imageUrlLabel}</Label>
        <Input placeholder={copy.imageUrlPlaceholder} type="url" />
        <Description>{copy.imageUrlHint}</Description>
      </TextField>
    </Surface>
  );
}
