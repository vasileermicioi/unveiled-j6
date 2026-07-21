import { ImageValidationError } from "./errors";

export type JpegDimensions = {
  width: number;
  height: number;
};

/** Baseline / progressive JPEG SOFn markers (excludes DHT 0xC4, JPG 0xC8, DAC 0xCC). */
function isSofMarker(marker: number): boolean {
  return marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
}

function readU16(buffer: Uint8Array, offset: number): number | null {
  const high = buffer[offset];
  const low = buffer[offset + 1];
  if (high === undefined || low === undefined) {
    return null;
  }
  return (high << 8) | low;
}

export function isJpegBuffer(buffer: Uint8Array): boolean {
  return buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
}

/**
 * Read width/height from a JPEG SOF segment without decoding pixels.
 * Returns null when the buffer is not a recognizable JPEG or no SOF is found.
 */
export function readJpegDimensions(buffer: Uint8Array): JpegDimensions | null {
  if (!isJpegBuffer(buffer)) {
    return null;
  }

  let offset = 2;
  while (offset + 3 < buffer.length) {
    if (buffer[offset] !== 0xff) {
      offset += 1;
      continue;
    }

    const marker = buffer[offset + 1];
    if (marker === undefined) {
      return null;
    }

    // Standalone markers / padding
    if (marker === 0x00 || marker === 0xff) {
      offset += 1;
      continue;
    }
    if (marker === 0xd9 /* EOI */ || marker === 0xda /* SOS */) {
      return null;
    }

    if (offset + 4 > buffer.length) {
      return null;
    }

    const segmentLength = readU16(buffer, offset + 2);
    if (segmentLength === null || segmentLength < 2 || offset + 2 + segmentLength > buffer.length) {
      return null;
    }

    if (isSofMarker(marker)) {
      // SOF: [len:2][precision:1][height:2][width:2]...
      if (segmentLength < 7) {
        return null;
      }
      const height = readU16(buffer, offset + 5);
      const width = readU16(buffer, offset + 7);
      if (height === null || width === null || width < 1 || height < 1) {
        return null;
      }
      return { width, height };
    }

    offset += 2 + segmentLength;
  }

  return null;
}

export function requireJpegDimensions(
  buffer: Uint8Array,
  label: string,
  claimed?: JpegDimensions | null,
): JpegDimensions {
  const inspected = readJpegDimensions(buffer);
  if (inspected) {
    return inspected;
  }

  if (claimed && claimed.width >= 1 && claimed.height >= 1) {
    return claimed;
  }

  throw new ImageValidationError(`Unable to read JPEG dimensions for ${label}`);
}
