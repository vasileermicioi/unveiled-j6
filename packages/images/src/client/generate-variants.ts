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
  ORIGINAL_MAX_EDGE,
  ORIGINAL_QUALITY,
  SMALL_MAX_WIDTH,
  SMALL_QUALITY,
  VARIANT_FILENAMES,
  type VariantFilename,
} from "../constants";
import { ImageValidationError } from "../errors";
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

function fitMaxEdge(srcWidth: number, srcHeight: number, maxEdge: number): Size {
  const longest = Math.max(srcWidth, srcHeight);
  if (longest <= maxEdge) {
    return { width: srcWidth, height: srcHeight };
  }
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(srcWidth * scale)),
    height: Math.max(1, Math.round(srcHeight * scale)),
  };
}

function jpegQuality(qualityPercent: number): number {
  return Math.min(1, Math.max(0, qualityPercent / 100));
}

async function encodeJpeg(canvas: ClientCanvas, qualityPercent: number): Promise<Blob> {
  const blob = await getResizer().toBlob(canvas, "image/jpeg", jpegQuality(qualityPercent));
  if (!blob || blob.size === 0) {
    throw new Error("Failed to encode JPEG variant");
  }
  return blob.type === "image/jpeg"
    ? blob
    : new Blob([await blob.arrayBuffer()], { type: "image/jpeg" });
}

async function resizeLadderVariant(
  source: ClientCanvas,
  srcWidth: number,
  srcHeight: number,
  target: Size,
  qualityPercent: number,
): Promise<Blob> {
  if (target.width === srcWidth && target.height === srcHeight) {
    return encodeJpeg(source, qualityPercent);
  }

  const dest = createClientCanvas(target.width, target.height);
  await getResizer().resize(source, dest);
  return encodeJpeg(dest, qualityPercent);
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
 * Browser-side generator mirroring server `generateImageVariants` rules:
 * six JPEG filenames, downscale-only ladder, OG center cover-crop to 1200×630.
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

  const originalSize = fitMaxEdge(decoded.width, decoded.height, ORIGINAL_MAX_EDGE);
  const heroSize = fitMaxWidth(decoded.width, decoded.height, HERO_MAX_WIDTH);
  const largeSize = fitMaxWidth(decoded.width, decoded.height, LARGE_MAX_WIDTH);
  const mediumSize = fitMaxWidth(decoded.width, decoded.height, MEDIUM_MAX_WIDTH);
  const smallSize = fitMaxWidth(decoded.width, decoded.height, SMALL_MAX_WIDTH);

  // Sequential: keep peak memory predictable for large admin uploads.
  const original = await resizeLadderVariant(
    decoded.canvas,
    decoded.width,
    decoded.height,
    originalSize,
    ORIGINAL_QUALITY,
  );
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
  const og1200x630 = await encodeJpeg(
    createOgCoverCrop(decoded.canvas, decoded.width, decoded.height),
    OG_QUALITY,
  );

  const variants = {
    "original.jpg": original,
    "hero-1920.jpg": hero1920,
    "large-1280.jpg": large1280,
    "medium-640.jpg": medium640,
    "small-320.jpg": small320,
    "og-1200x630.jpg": og1200x630,
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
