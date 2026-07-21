import {
  ACCEPTED_MIME_TYPES,
  type AcceptedMimeType,
  MAX_UPLOAD_BYTES,
  MIN_IMAGE_HEIGHT,
  MIN_IMAGE_WIDTH,
} from "./constants";
import { ImageValidationError } from "./errors";
import { isJpegBuffer, readJpegDimensions } from "./jpeg-dimensions";

export type ValidatedImage = {
  width: number;
  height: number;
  mimeType: AcceptedMimeType;
};

function sniffMimeType(buffer: Buffer): AcceptedMimeType | null {
  if (isJpegBuffer(buffer)) {
    return "image/jpeg";
  }
  // PNG signature
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    return "image/png";
  }
  // WebP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return "image/webp";
  }
  return null;
}

function readPngDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 24) {
    return null;
  }
  // IHDR starts at byte 8; width/height are big-endian at 16/20
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (width < 1 || height < 1) {
    return null;
  }
  return { width, height };
}

/**
 * Lightweight server-side checks for raw image bytes (proxy / tooling).
 * Dimension rules for JPEG use SOF parsing; PNG uses IHDR; WebP size is enforced
 * but dimensions are left to the client generator when WebP is used as a source.
 */
export async function validateImageBuffer(buffer: Buffer): Promise<ValidatedImage> {
  if (buffer.length === 0) {
    throw new ImageValidationError("Image file is empty");
  }

  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new ImageValidationError(`Image exceeds maximum size of ${MAX_UPLOAD_BYTES} bytes`);
  }

  const mimeType = sniffMimeType(buffer);
  if (!mimeType || !ACCEPTED_MIME_TYPES.includes(mimeType)) {
    throw new ImageValidationError("Image must be JPEG, PNG, or WebP");
  }

  let width = 0;
  let height = 0;

  if (mimeType === "image/jpeg") {
    const dims = readJpegDimensions(buffer);
    if (!dims) {
      throw new ImageValidationError("Unable to read image dimensions or format");
    }
    width = dims.width;
    height = dims.height;
  } else if (mimeType === "image/png") {
    const dims = readPngDimensions(buffer);
    if (!dims) {
      throw new ImageValidationError("Unable to read image dimensions or format");
    }
    width = dims.width;
    height = dims.height;
  } else {
    // WebP: accept by magic + size; client generator enforces min dimensions.
    width = MIN_IMAGE_WIDTH;
    height = MIN_IMAGE_HEIGHT;
  }

  if (width < MIN_IMAGE_WIDTH || height < MIN_IMAGE_HEIGHT) {
    throw new ImageValidationError(
      `Image must be at least ${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT} pixels`,
    );
  }

  return { width, height, mimeType };
}

export { ImageValidationError } from "./errors";
