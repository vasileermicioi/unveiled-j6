import { REMOTE_FETCH_MAX_BYTES } from "./constants";
import { ImageValidationError } from "./errors";
import { isJpegBuffer, readJpegDimensions } from "./jpeg-dimensions";
import { isWebpBuffer, readWebpDimensions } from "./webp-dimensions";

export type ValidatedImage = {
  width: number;
  height: number;
  mimeType: string;
};

function sniffMimeType(buffer: Buffer): string | null {
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
  if (isWebpBuffer(buffer)) {
    return "image/webp";
  }
  // SVG (text sniff) — dimensions left to the client generator
  const head = buffer.subarray(0, Math.min(buffer.length, 256)).toString("utf8").trimStart();
  if (head.startsWith("<svg") || head.startsWith("<?xml")) {
    return "image/svg+xml";
  }
  // GIF
  if (
    buffer.length >= 6 &&
    buffer[0] === 0x47 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x38
  ) {
    return "image/gif";
  }
  return null;
}

function readPngDimensions(buffer: Buffer): { width: number; height: number } | null {
  if (buffer.length < 24) {
    return null;
  }
  const width = buffer.readUInt32BE(16);
  const height = buffer.readUInt32BE(20);
  if (width < 1 || height < 1) {
    return null;
  }
  return { width, height };
}

/**
 * Lightweight server-side checks for raw image bytes (proxy / tooling).
 * No product min-dimension or 8 MB gate — only a documented abuse byte ceiling.
 * Dimension rules for JPEG use SOF; PNG uses IHDR; WebP uses bitstream headers;
 * SVG/GIF return placeholder 1×1 (client generator enforces decode success).
 */
export async function validateImageBuffer(buffer: Buffer): Promise<ValidatedImage> {
  if (buffer.length === 0) {
    throw new ImageValidationError("Image file is empty");
  }

  if (buffer.length > REMOTE_FETCH_MAX_BYTES) {
    throw new ImageValidationError(
      `Image exceeds proxy abuse limit of ${REMOTE_FETCH_MAX_BYTES} bytes`,
    );
  }

  const mimeType = sniffMimeType(buffer);
  if (!mimeType) {
    throw new ImageValidationError("Image format is not recognized");
  }

  let width = 1;
  let height = 1;

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
  } else if (mimeType === "image/webp") {
    const dims = readWebpDimensions(buffer);
    if (dims) {
      width = dims.width;
      height = dims.height;
    }
  }

  return { width, height, mimeType };
}

export { ImageValidationError } from "./errors";
