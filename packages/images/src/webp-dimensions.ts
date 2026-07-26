import { ImageValidationError } from "./errors";

export type WebpDimensions = {
  width: number;
  height: number;
};

function readU16LE(buffer: Uint8Array, offset: number): number | null {
  const low = buffer[offset];
  const high = buffer[offset + 1];
  if (low === undefined || high === undefined) {
    return null;
  }
  return low | (high << 8);
}

function readU24LE(buffer: Uint8Array, offset: number): number | null {
  const a = buffer[offset];
  const b = buffer[offset + 1];
  const c = buffer[offset + 2];
  if (a === undefined || b === undefined || c === undefined) {
    return null;
  }
  return a | (b << 8) | (c << 16);
}

function readFourCC(buffer: Uint8Array, offset: number): string | null {
  if (offset + 4 > buffer.length) {
    return null;
  }
  return String.fromCharCode(
    buffer[offset] ?? 0,
    buffer[offset + 1] ?? 0,
    buffer[offset + 2] ?? 0,
    buffer[offset + 3] ?? 0,
  );
}

/** RIFF....WEBP magic. */
export function isWebpBuffer(buffer: Uint8Array): boolean {
  return (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  );
}

function readVp8Dimensions(chunk: Uint8Array): WebpDimensions | null {
  // Lossy VP8 bitstream: frame tag (3) + start code 0x9d012a + 16-bit width/height
  if (chunk.length < 10) {
    return null;
  }
  if (chunk[3] !== 0x9d || chunk[4] !== 0x01 || chunk[5] !== 0x2a) {
    return null;
  }
  const widthFull = readU16LE(chunk, 6);
  const heightFull = readU16LE(chunk, 8);
  if (widthFull === null || heightFull === null) {
    return null;
  }
  const width = widthFull & 0x3fff;
  const height = heightFull & 0x3fff;
  if (width < 1 || height < 1) {
    return null;
  }
  return { width, height };
}

function readVp8LDimensions(chunk: Uint8Array): WebpDimensions | null {
  // Lossless: signature 0x2f + 14-bit width-1 / height-1 packed in 32 bits LE
  if (chunk.length < 5 || chunk[0] !== 0x2f) {
    return null;
  }
  const b1 = chunk[1] ?? 0;
  const b2 = chunk[2] ?? 0;
  const b3 = chunk[3] ?? 0;
  const b4 = chunk[4] ?? 0;
  const bits = b1 | (b2 << 8) | (b3 << 16) | (b4 << 24);
  const width = (bits & 0x3fff) + 1;
  const height = ((bits >> 14) & 0x3fff) + 1;
  if (width < 1 || height < 1) {
    return null;
  }
  return { width, height };
}

function readVp8XDimensions(chunk: Uint8Array): WebpDimensions | null {
  // Extended: 1 byte flags + 3 reserved + 3 bytes canvas width-1 + 3 bytes height-1
  if (chunk.length < 10) {
    return null;
  }
  const widthMinus1 = readU24LE(chunk, 4);
  const heightMinus1 = readU24LE(chunk, 7);
  if (widthMinus1 === null || heightMinus1 === null) {
    return null;
  }
  const width = widthMinus1 + 1;
  const height = heightMinus1 + 1;
  if (width < 1 || height < 1) {
    return null;
  }
  return { width, height };
}

/**
 * Read width/height from a WebP bitstream without decoding pixels.
 * Returns null when the buffer is not a recognizable WebP or dims cannot be read.
 */
export function readWebpDimensions(buffer: Uint8Array): WebpDimensions | null {
  if (!isWebpBuffer(buffer)) {
    return null;
  }

  let offset = 12;
  while (offset + 8 <= buffer.length) {
    const fourCC = readFourCC(buffer, offset);
    // Chunk size is 32-bit LE
    const sizeLow = buffer[offset + 4];
    const sizeMid = buffer[offset + 5];
    const sizeHigh = buffer[offset + 6];
    const sizeTop = buffer[offset + 7];
    if (
      fourCC === null ||
      sizeLow === undefined ||
      sizeMid === undefined ||
      sizeHigh === undefined ||
      sizeTop === undefined
    ) {
      return null;
    }
    const payloadSize = sizeLow | (sizeMid << 8) | (sizeHigh << 16) | (sizeTop << 24);
    const payloadStart = offset + 8;
    const payloadEnd = payloadStart + payloadSize;
    if (payloadEnd > buffer.length || payloadSize < 0) {
      return null;
    }

    const chunk = buffer.subarray(payloadStart, payloadEnd);

    if (fourCC === "VP8X") {
      const dims = readVp8XDimensions(chunk);
      if (dims) {
        return dims;
      }
    } else if (fourCC === "VP8 ") {
      const dims = readVp8Dimensions(chunk);
      if (dims) {
        return dims;
      }
    } else if (fourCC === "VP8L") {
      const dims = readVp8LDimensions(chunk);
      if (dims) {
        return dims;
      }
    }

    // Chunks are padded to even size
    offset = payloadEnd + (payloadSize % 2);
  }

  return null;
}

export function requireWebpDimensions(buffer: Uint8Array, label: string): WebpDimensions {
  const inspected = readWebpDimensions(buffer);
  if (inspected) {
    return inspected;
  }
  throw new ImageValidationError(`Unable to read WebP dimensions for ${label}`);
}
