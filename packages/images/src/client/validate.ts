import { ImageValidationError } from "../errors";

export type ClientValidatedMeta = {
  width: number;
  height: number;
  mimeType: string | null;
  byteLength: number | null;
};

/**
 * Validate Blob/File before decode. Acceptance is decode-success — no product
 * MIME allowlist, min dimensions, or max byte gate. ImageBitmap skips this.
 */
export function validateClientBlob(blob: Blob): { mimeType: string | null } {
  if (blob.size === 0) {
    throw new ImageValidationError("Image file is empty");
  }

  const rawType = blob.type.trim().toLowerCase();
  if (rawType) {
    const mime = rawType.split(";")[0]?.trim() ?? "";
    // Allow empty/unknown types (sniff on decode). Reject non-image when claimed.
    if (mime && !mime.startsWith("image/") && mime !== "application/octet-stream") {
      throw new ImageValidationError("Selected file must be an image the browser can decode");
    }
    return { mimeType: mime || null };
  }

  return { mimeType: null };
}

export function validateClientDimensions(width: number, height: number): void {
  if (!width || !height) {
    throw new ImageValidationError("Unable to read image dimensions or format");
  }
}
