import { Paragraph } from "@heroui/react";

import { normalizeImageCredit } from "../lib/image-credit";

export type ImageCreditNoteProps = {
  credit: string | null | undefined;
  /** Extra BEM class (e.g. hero/lightbox hooks). */
  className?: string;
};

/** Footer/header note on a large photo. Empty credit renders nothing. */
export function ImageCreditNote({ credit, className }: ImageCreditNoteProps) {
  const text = normalizeImageCredit(credit);
  if (!text) {
    return null;
  }

  const classes = className ? `image-credit-note ${className}` : "image-credit-note";

  return (
    <Paragraph className={classes} size="sm">
      {text}
    </Paragraph>
  );
}
