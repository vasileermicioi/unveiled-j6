import sharp from "sharp";

import {
  ACCEPTED_MIME_TYPES,
  type AcceptedMimeType,
  MAX_UPLOAD_BYTES,
  MIN_IMAGE_HEIGHT,
  MIN_IMAGE_WIDTH,
} from "./constants";

const FORMAT_TO_MIME: Record<string, AcceptedMimeType> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageValidationError";
  }
}

export type ValidatedImage = {
  width: number;
  height: number;
  mimeType: AcceptedMimeType;
};

export async function validateImageBuffer(buffer: Buffer): Promise<ValidatedImage> {
  if (buffer.length === 0) {
    throw new ImageValidationError("Image file is empty");
  }

  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new ImageValidationError(`Image exceeds maximum size of ${MAX_UPLOAD_BYTES} bytes`);
  }

  const metadata = await sharp(buffer).metadata();
  const width = metadata.width;
  const height = metadata.height;
  const format = metadata.format;

  if (!width || !height || !format) {
    throw new ImageValidationError("Unable to read image dimensions or format");
  }

  const mimeType = FORMAT_TO_MIME[format];
  if (!mimeType || !ACCEPTED_MIME_TYPES.includes(mimeType)) {
    throw new ImageValidationError("Image must be JPEG, PNG, or WebP");
  }

  if (width < MIN_IMAGE_WIDTH || height < MIN_IMAGE_HEIGHT) {
    throw new ImageValidationError(
      `Image must be at least ${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT} pixels`,
    );
  }

  return { width, height, mimeType };
}

export function validateRemoteContentType(contentType: string | null): AcceptedMimeType {
  const normalized = contentType?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (!ACCEPTED_MIME_TYPES.includes(normalized as AcceptedMimeType)) {
    throw new ImageValidationError("Remote URL must point to a JPEG, PNG, or WebP image");
  }
  return normalized as AcceptedMimeType;
}
