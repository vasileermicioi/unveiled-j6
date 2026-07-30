import picaFactory, { type Pica } from "pica";

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
  SMALL_MAX_WIDTH,
  SMALL_QUALITY,
  VARIANT_FILENAMES,
  type VariantFilename,
} from "../constants";
import { ImageValidationError } from "../errors";
import { isWebpBuffer } from "../webp-dimensions";
import { type ClientCanvas, createClientCanvas, get2dContext } from "./canvas";
import { type DecodedSource, decodeImageSource } from "./decode";
import { validateClientBlob, validateClientDimensions } from "./validate";

export type ClientImageSource = "UPLOAD" | "REMOTE_URL";

export type ClientProcessedImageMetadata = {
  width: number;
  height: number;
  source: ClientImageSource;
  sourceUrl?: string | null;
};

export type ClientProcessedImageResult = {
  imageId: string;
  metadata: ClientProcessedImageMetadata;
  variants: Record<VariantFilename, Blob>;
};

export type ClientGenerateVariantsOptions = {
  imageId?: string;
  source?: ClientImageSource;
  sourceUrl?: string | null;
};

type Size = { width: number; height: number };

let sharedResizer: Pica | null = null;

function isImageBitmapInput(value: File | Blob | ImageBitmap): value is ImageBitmap {
  return typeof ImageBitmap !== "undefined" && value instanceof ImageBitmap;
}

function getResizer(): Pica {
  if (!sharedResizer) {
    const features =
      typeof Worker !== "undefined" ? (["js", "wasm", "ww"] as const) : (["js"] as const);
    sharedResizer = picaFactory({ features: [...features] });
  }
  return sharedResizer;
}

function fitMaxWidth(srcWidth: number, srcHeight: number, maxWidth: number): Size {
  if (srcWidth <= maxWidth) {
    return { width: srcWidth, height: srcHeight };
  }
  const width = maxWidth;
  const height = Math.max(1, Math.round((srcHeight * maxWidth) / srcWidth));
  return { width, height };
}

function webpQuality(qualityPercent: number): number {
  return Math.min(1, Math.max(0, qualityPercent / 100));
}

async function encodeWebp(canvas: ClientCanvas, qualityPercent: number): Promise<Blob> {
  let blob: Blob | null = null;
  try {
    blob = await getResizer().toBlob(canvas, "image/webp", webpQuality(qualityPercent));
  } catch {
    blob = null;
  }

  if (!blob || blob.size === 0) {
    throw new ImageValidationError(
      "WebP encoding is not supported in this browser (canvas.toBlob image/webp failed)",
    );
  }

  const bytes = new Uint8Array(await blob.arrayBuffer());
  // Browsers / pica may fall back to PNG/JPEG while still labeling the blob as image/webp.
  if (!isWebpBuffer(bytes)) {
    throw new ImageValidationError(
      "WebP encoding is not supported in this browser (canvas.toBlob image/webp failed)",
    );
  }

  return new Blob([bytes], { type: "image/webp" });
}

async function resizeLadderVariant(
  source: ClientCanvas,
  srcWidth: number,
  srcHeight: number,
  target: Size,
  qualityPercent: number,
): Promise<Blob> {
  if (target.width === srcWidth && target.height === srcHeight) {
    return encodeWebp(source, qualityPercent);
  }

  const dest = createClientCanvas(target.width, target.height);
  await getResizer().resize(source, dest);
  return encodeWebp(dest, qualityPercent);
}

function createOgCoverCrop(
  source: ClientCanvas,
  srcWidth: number,
  srcHeight: number,
): ClientCanvas {
  const scale = Math.max(OG_WIDTH / srcWidth, OG_HEIGHT / srcHeight);
  const scaledWidth = srcWidth * scale;
  const scaledHeight = srcHeight * scale;
  const offsetX = (scaledWidth - OG_WIDTH) / 2;
  const offsetY = (scaledHeight - OG_HEIGHT) / 2;

  const dest = createClientCanvas(OG_WIDTH, OG_HEIGHT);
  get2dContext(dest).drawImage(source, -offsetX, -offsetY, scaledWidth, scaledHeight);
  return dest;
}

/**
 * Browser-side generator: five WebP filenames, downscale-only ladder,
 * OG center cover-crop to 1200×630. Accepts any browser-decodable source
 * (including SVG — vectors are rasterized at ≥ hero width so ladder sizes stay sharp).
 * Does not import `@standardagents/sip`.
 */
export async function generateImageVariantsClient(
  source: File | Blob | ImageBitmap,
  options: ClientGenerateVariantsOptions = {},
): Promise<ClientProcessedImageResult> {
  if (!isImageBitmapInput(source)) {
    validateClientBlob(source);
  }

  let decoded: DecodedSource;
  try {
    decoded = await decodeImageSource(source);
  } catch (error) {
    if (error instanceof ImageValidationError) {
      throw error;
    }
    throw new ImageValidationError("Unable to read image dimensions or format");
  }

  validateClientDimensions(decoded.width, decoded.height);

  const imageId = options.imageId ?? crypto.randomUUID();
  const sourceKind = options.source ?? "UPLOAD";

  const heroSize = fitMaxWidth(decoded.width, decoded.height, HERO_MAX_WIDTH);
  const largeSize = fitMaxWidth(decoded.width, decoded.height, LARGE_MAX_WIDTH);
  const mediumSize = fitMaxWidth(decoded.width, decoded.height, MEDIUM_MAX_WIDTH);
  const smallSize = fitMaxWidth(decoded.width, decoded.height, SMALL_MAX_WIDTH);

  // Sequential: keep peak memory predictable for large admin uploads.
  const hero1920 = await resizeLadderVariant(
    decoded.canvas,
    decoded.width,
    decoded.height,
    heroSize,
    HERO_QUALITY,
  );
  const large1280 = await resizeLadderVariant(
    decoded.canvas,
    decoded.width,
    decoded.height,
    largeSize,
    LARGE_QUALITY,
  );
  const medium640 = await resizeLadderVariant(
    decoded.canvas,
    decoded.width,
    decoded.height,
    mediumSize,
    MEDIUM_QUALITY,
  );
  const small320 = await resizeLadderVariant(
    decoded.canvas,
    decoded.width,
    decoded.height,
    smallSize,
    SMALL_QUALITY,
  );
  const og1200x630 = await encodeWebp(
    createOgCoverCrop(decoded.canvas, decoded.width, decoded.height),
    OG_QUALITY,
  );

  const variants = {
    "hero-1920.webp": hero1920,
    "large-1280.webp": large1280,
    "medium-640.webp": medium640,
    "small-320.webp": small320,
    "og-1200x630.webp": og1200x630,
  } satisfies Record<VariantFilename, Blob>;

  for (const filename of VARIANT_FILENAMES) {
    if (!variants[filename]) {
      throw new Error(`Missing generated variant: ${filename}`);
    }
  }

  return {
    imageId,
    metadata: {
      width: decoded.width,
      height: decoded.height,
      source: sourceKind,
      sourceUrl: options.sourceUrl ?? null,
    },
    variants,
  };
}
