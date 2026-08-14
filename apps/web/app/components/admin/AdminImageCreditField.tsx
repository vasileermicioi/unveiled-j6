import { Description, Input, Label, TextField } from "@heroui/react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

/** Matches catalog `IMAGE_CREDIT_MAX_LENGTH` — do not import catalog/images in islands. */
export const ADMIN_IMAGE_CREDIT_MAX_LENGTH = 200;

export type AdminImageCreditFieldProps = {
  locale: Locale;
  name: string;
  defaultValue?: string | null;
  /** Stop drag-to-reorder when the field lives on a sortable gallery tile. */
  stopDrag?: boolean;
  /** Hide label/hint chrome — tile grids keep a single-line input. */
  compact?: boolean;
  /** Native `title` on the input (full credit when the field is narrow). */
  title?: string;
  onValueChange?: (value: string) => void;
};

function stopDragGesture(event: { stopPropagation: () => void }) {
  event.stopPropagation();
}

/** Optional photo credit text field (HeroUI TextField — hard rule §14). */
export function AdminImageCreditField({
  locale,
  name,
  defaultValue = "",
  stopDrag = false,
  compact = false,
  title,
  onValueChange,
}: AdminImageCreditFieldProps) {
  const copy = getAdminCopy(locale);
  const dragHandlers = stopDrag
    ? {
        onMouseDown: stopDragGesture,
        onPointerDown: stopDragGesture,
        onTouchStart: stopDragGesture,
      }
    : undefined;

  return (
    <TextField
      className={compact ? "admin-image-credit-field--compact" : undefined}
      defaultValue={defaultValue ?? ""}
      fullWidth
      name={name}
      {...dragHandlers}
    >
      <Label>{copy.imageCreditLabel}</Label>
      <Input
        maxLength={ADMIN_IMAGE_CREDIT_MAX_LENGTH}
        onChange={(event) => {
          const native = event.currentTarget as unknown as HTMLInputElement;
          onValueChange?.(native.value);
        }}
        title={title || undefined}
      />
      {compact ? null : <Description>{copy.imageCreditHint}</Description>}
    </TextField>
  );
}
