import { inspect } from "@standardagents/sip";

import {
  ACCEPTED_MIME_TYPES,
  type AcceptedMimeType,
  MAX_UPLOAD_BYTES,
  MIN_IMAGE_HEIGHT,
  MIN_IMAGE_WIDTH,
} from "./constants";
import { ImageValidationError } from "./errors";
import { sipReady } from "./sip-ready";

const FORMAT_TO_MIME: Record<string, AcceptedMimeType> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

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

  await sipReady;

  let info: { format: string; width: number; height: number };
  try {
    const result = await inspect(new Uint8Array(buffer));
    info = result.info;
  } catch {
    throw new ImageValidationError("Unable to read image dimensions or format");
  }

  const { width, height, format } = info;

  if (!width || !height || !format || format === "unknown") {
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

export { ImageValidationError } from "./errors";
