import {
  collect,
  decode,
  encodeJpeg,
  inspect,
  type PixelStream,
  type Scanline,
  transform,
} from "@standardagents/sip";

import {
  HERO_MAX_WIDTH,
  HERO_QUALITY,
  LARGE_MAX_WIDTH,
  LARGE_QUALITY,
  MEDIUM_MAX_WIDTH,
  MEDIUM_QUALITY,
  OG_HEIGHT,
  OG_QUALITY,
  OG_WIDTH,
  ORIGINAL_MAX_EDGE,
  ORIGINAL_QUALITY,
  SMALL_MAX_WIDTH,
  SMALL_QUALITY,
  VARIANT_FILENAMES,
  type VariantFilename,
} from "./constants";
import { sipReady } from "./sip-ready";
import { validateImageBuffer } from "./validation";

export type ImageSource = "UPLOAD" | "REMOTE_URL";

export type ProcessedImageMetadata = {
  width: number;
  height: number;
  source: ImageSource;
  sourceUrl?: string | null;
};

export type ProcessedImageResult = {
  imageId: string;
  variants: Record<VariantFilename, Buffer>;
  metadata: ProcessedImageMetadata;
};

export type GenerateVariantsOptions = {
  source: ImageSource;
  sourceUrl?: string | null;
  imageId?: string;
};

function toBuffer(data: ArrayBuffer): Buffer {
  return Buffer.from(data);
}

async function createMaxBoundVariant(
  input: Uint8Array,
  maxWidth: number,
  maxHeight: number | undefined,
  quality: number,
): Promise<Buffer> {
  const encoded = transform(input, {
    width: maxWidth,
    ...(maxHeight !== undefined ? { height: maxHeight } : {}),
    quality,
  });
  const { data } = await collect(encoded);
  return toBuffer(data);
}

async function collectRgbBitmap(stream: PixelStream): Promise<{
  width: number;
  height: number;
  originalFormat: "jpeg" | "png" | "webp" | "avif";
  pixels: Uint8Array;
}> {
  // sip resolves `stream.info` only after iteration starts — do not await info first.
  const rows: Uint8Array[] = [];
  let width = 0;
  for await (const scanline of stream) {
    width = scanline.width;
    rows.push(Uint8Array.from(scanline.data));
  }
  const info = await stream.info;
  const height = rows.length;
  const pixels = new Uint8Array(width * height * 3);
  for (let y = 0; y < height; y++) {
    const row = rows[y];
    if (row) {
      pixels.set(row, y * width * 3);
    }
  }
  return {
    width: info.width,
    height: info.height,
    originalFormat: info.originalFormat,
    pixels,
  };
}

function sampleBilinear(
  pixels: Uint8Array,
  srcWidth: number,
  srcHeight: number,
  x: number,
  y: number,
  out: Uint8Array,
  outOffset: number,
): void {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, srcWidth - 1);
  const y1 = Math.min(y0 + 1, srcHeight - 1);
  const tx = x - x0;
  const ty = y - y0;

  const i00 = (y0 * srcWidth + x0) * 3;
  const i10 = (y0 * srcWidth + x1) * 3;
  const i01 = (y1 * srcWidth + x0) * 3;
  const i11 = (y1 * srcWidth + x1) * 3;

  for (let c = 0; c < 3; c++) {
    const p00 = pixels[i00 + c] ?? 0;
    const p10 = pixels[i10 + c] ?? 0;
    const p01 = pixels[i01 + c] ?? 0;
    const p11 = pixels[i11 + c] ?? 0;
    const top = p00 * (1 - tx) + p10 * tx;
    const bottom = p01 * (1 - tx) + p11 * tx;
    out[outOffset + c] = Math.round(top * (1 - ty) + bottom * ty);
  }
}

/**
 * Center cover-crop to exactly OG_WIDTH × OG_HEIGHT (upscale allowed).
 * sip `transform`/`resize` never upscale and do not cover-crop, so this path
 * buffers RGB once for the OG variant only.
 */
async function createOgVariant(input: Uint8Array): Promise<Buffer> {
  const bitmap = await collectRgbBitmap(decode(input));
  const scale = Math.max(OG_WIDTH / bitmap.width, OG_HEIGHT / bitmap.height);
  const scaledWidth = Math.max(1, Math.round(bitmap.width * scale));
  const scaledHeight = Math.max(1, Math.round(bitmap.height * scale));
  const offsetX = (scaledWidth - OG_WIDTH) / 2;
  const offsetY = (scaledHeight - OG_HEIGHT) / 2;

  const cropped = new Uint8Array(OG_WIDTH * OG_HEIGHT * 3);
  for (let y = 0; y < OG_HEIGHT; y++) {
    for (let x = 0; x < OG_WIDTH; x++) {
      const srcX = (x + offsetX + 0.5) / scale - 0.5;
      const srcY = (y + offsetY + 0.5) / scale - 0.5;
      const clampedX = Math.min(Math.max(srcX, 0), bitmap.width - 1);
      const clampedY = Math.min(Math.max(srcY, 0), bitmap.height - 1);
      sampleBilinear(
        bitmap.pixels,
        bitmap.width,
        bitmap.height,
        clampedX,
        clampedY,
        cropped,
        (y * OG_WIDTH + x) * 3,
      );
    }
  }

  const rowSize = OG_WIDTH * 3;
  const pixelStream: PixelStream = {
    info: Promise.resolve({
      width: OG_WIDTH,
      height: OG_HEIGHT,
      originalFormat: bitmap.originalFormat,
    }),
    [Symbol.asyncIterator]() {
      return (async function* (): AsyncGenerator<Scanline> {
        for (let y = 0; y < OG_HEIGHT; y++) {
          yield {
            data: cropped.subarray(y * rowSize, (y + 1) * rowSize),
            width: OG_WIDTH,
            y,
          };
        }
      })();
    },
  };

  const { data } = await collect(encodeJpeg(pixelStream, { quality: OG_QUALITY }));
  return toBuffer(data);
}

export async function generateImageVariants(
  buffer: Buffer,
  options: GenerateVariantsOptions,
): Promise<ProcessedImageResult> {
  const validated = await validateImageBuffer(buffer);
  await sipReady;

  const input = new Uint8Array(buffer);
  const imageId = options.imageId ?? crypto.randomUUID();

  // Sequential: sip's WASM JPEG decoder is not safe under concurrent transform() calls
  // (parallel Promise.all surfaces as "Failed to start JPEG decompression" / unhandled rejections).
  const original = await createMaxBoundVariant(
    input,
    ORIGINAL_MAX_EDGE,
    ORIGINAL_MAX_EDGE,
    ORIGINAL_QUALITY,
  );
  const hero1920 = await createMaxBoundVariant(input, HERO_MAX_WIDTH, undefined, HERO_QUALITY);
  const large1280 = await createMaxBoundVariant(input, LARGE_MAX_WIDTH, undefined, LARGE_QUALITY);
  const medium640 = await createMaxBoundVariant(input, MEDIUM_MAX_WIDTH, undefined, MEDIUM_QUALITY);
  const small320 = await createMaxBoundVariant(input, SMALL_MAX_WIDTH, undefined, SMALL_QUALITY);
  const og1200x630 = await createOgVariant(input);

  const variants = {
    "original.jpg": original,
    "hero-1920.jpg": hero1920,
    "large-1280.jpg": large1280,
    "medium-640.jpg": medium640,
    "small-320.jpg": small320,
    "og-1200x630.jpg": og1200x630,
  } satisfies Record<VariantFilename, Buffer>;

  for (const filename of VARIANT_FILENAMES) {
    if (!variants[filename]) {
      throw new Error(`Missing generated variant: ${filename}`);
    }
  }

  return {
    imageId,
    variants,
    metadata: {
      width: validated.width,
      height: validated.height,
      source: options.source,
      sourceUrl: options.sourceUrl ?? null,
    },
  };
}

export async function getVariantDimensions(
  variants: Record<VariantFilename, Buffer>,
): Promise<Record<VariantFilename, { width: number; height: number }>> {
  await sipReady;

  const entries = await Promise.all(
    VARIANT_FILENAMES.map(async (filename) => {
      const { info } = await inspect(new Uint8Array(variants[filename]));
      return [
        filename,
        {
          width: info.width,
          height: info.height,
        },
      ] as const;
    }),
  );

  return Object.fromEntries(entries) as Record<VariantFilename, { width: number; height: number }>;
}
