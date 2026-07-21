import {
  ACCEPTED_MIME_TYPES,
  type AcceptedMimeType,
  MAX_UPLOAD_BYTES,
  MIN_IMAGE_HEIGHT,
  MIN_IMAGE_WIDTH,
} from "../constants";
import { ImageValidationError } from "../errors";

export type ClientValidatedMeta = {
  width: number;
  height: number;
  mimeType: AcceptedMimeType | null;
  byteLength: number | null;
};

function isAcceptedMimeType(value: string): value is AcceptedMimeType {
  return (ACCEPTED_MIME_TYPES as readonly string[]).includes(value);
}

/** Validate Blob/File byte size and MIME before decode. ImageBitmap skips byte checks. */
export function validateClientBlob(blob: Blob): { mimeType: AcceptedMimeType | null } {
  if (blob.size === 0) {
    throw new ImageValidationError("Image file is empty");
  }

  if (blob.size > MAX_UPLOAD_BYTES) {
    throw new ImageValidationError(`Image exceeds maximum size of ${MAX_UPLOAD_BYTES} bytes`);
  }

  const rawType = blob.type.trim().toLowerCase();
  if (rawType) {
    const mime = rawType.split(";")[0]?.trim() ?? "";
    if (!isAcceptedMimeType(mime)) {
      throw new ImageValidationError("Image must be JPEG, PNG, or WebP");
    }
    return { mimeType: mime };
  }

  return { mimeType: null };
}

export function validateClientDimensions(width: number, height: number): void {
  if (!width || !height) {
    throw new ImageValidationError("Unable to read image dimensions or format");
  }

  if (width < MIN_IMAGE_WIDTH || height < MIN_IMAGE_HEIGHT) {
    throw new ImageValidationError(
      `Image must be at least ${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT} pixels`,
    );
  }
}
