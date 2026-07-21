import {
  HERO_MAX_WIDTH,
  LARGE_MAX_WIDTH,
  MAX_UPLOAD_BYTES,
  MEDIUM_MAX_WIDTH,
  MIN_IMAGE_HEIGHT,
  MIN_IMAGE_WIDTH,
  OG_HEIGHT,
  OG_WIDTH,
  ORIGINAL_MAX_EDGE,
  SMALL_MAX_WIDTH,
  VARIANT_FILENAMES,
  type VariantFilename,
} from "./constants";
import { ImageValidationError } from "./errors";
import { isJpegBuffer, requireJpegDimensions } from "./jpeg-dimensions";
import { createS3Client, deleteImageObjects, readS3Env, uploadImageVariants } from "./s3";
import type { ImageSource, ProcessedImageResult } from "./types";

export type PrebuiltImageVariantsInput = {
  imageId: string;
  variants: Record<VariantFilename, Buffer>;
  /** Client-claimed source size; used only when original.jpg SOF parse fails */
  claimedWidth?: number;
  claimedHeight?: number;
};

export type PersistPrebuiltOptions = {
  skipUpload?: boolean;
  source?: ImageSource;
  sourceUrl?: string | null;
};

export type PrebuiltVariantDimensions = Record<VariantFilename, { width: number; height: number }>;

const LADDER_MAX_WIDTH = {
  "hero-1920.jpg": HERO_MAX_WIDTH,
  "large-1280.jpg": LARGE_MAX_WIDTH,
  "medium-640.jpg": MEDIUM_MAX_WIDTH,
  "small-320.jpg": SMALL_MAX_WIDTH,
} as const;

function asUint8Array(buffer: Buffer): Uint8Array {
  return buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
}

function claimedOriginalDimensions(
  input: PrebuiltImageVariantsInput,
): { width: number; height: number } | null {
  if (
    typeof input.claimedWidth === "number" &&
    typeof input.claimedHeight === "number" &&
    input.claimedWidth >= 1 &&
    input.claimedHeight >= 1
  ) {
    return { width: input.claimedWidth, height: input.claimedHeight };
  }
  return null;
}

export function validatePrebuiltVariants(
  input: PrebuiltImageVariantsInput,
): PrebuiltVariantDimensions {
  if (!input.imageId || typeof input.imageId !== "string") {
    throw new ImageValidationError("imageId is required");
  }

  const dimensions = {} as PrebuiltVariantDimensions;

  for (const filename of VARIANT_FILENAMES) {
    const buffer = input.variants[filename];
    if (!buffer || buffer.length === 0) {
      throw new ImageValidationError(`Missing required variant: ${filename}`);
    }
    if (buffer.length > MAX_UPLOAD_BYTES) {
      throw new ImageValidationError(
        `Variant ${filename} exceeds maximum size of ${MAX_UPLOAD_BYTES} bytes`,
      );
    }
    if (!isJpegBuffer(asUint8Array(buffer))) {
      throw new ImageValidationError(`Variant ${filename} must be a JPEG image`);
    }
  }

  const claimed = claimedOriginalDimensions(input);
  const originalDims = requireJpegDimensions(
    asUint8Array(input.variants["original.jpg"]),
    "original.jpg",
    claimed,
  );
  dimensions["original.jpg"] = originalDims;

  if (originalDims.width < MIN_IMAGE_WIDTH || originalDims.height < MIN_IMAGE_HEIGHT) {
    throw new ImageValidationError(
      `original.jpg must be at least ${MIN_IMAGE_WIDTH}x${MIN_IMAGE_HEIGHT} pixels`,
    );
  }

  const originalLongest = Math.max(originalDims.width, originalDims.height);
  if (originalLongest > ORIGINAL_MAX_EDGE) {
    throw new ImageValidationError(
      `original.jpg longest edge must be at most ${ORIGINAL_MAX_EDGE} pixels`,
    );
  }

  for (const filename of [
    "hero-1920.jpg",
    "large-1280.jpg",
    "medium-640.jpg",
    "small-320.jpg",
  ] as const) {
    const dims = requireJpegDimensions(asUint8Array(input.variants[filename]), filename);
    dimensions[filename] = dims;

    const maxWidth = LADDER_MAX_WIDTH[filename];
    if (dims.width > maxWidth) {
      throw new ImageValidationError(
        `Variant ${filename} width ${dims.width} exceeds max ${maxWidth}`,
      );
    }
    if (dims.width > originalDims.width || dims.height > originalDims.height) {
      throw new ImageValidationError(`Variant ${filename} must not be larger than original.jpg`);
    }
  }

  const ogDims = requireJpegDimensions(
    asUint8Array(input.variants["og-1200x630.jpg"]),
    "og-1200x630.jpg",
  );
  dimensions["og-1200x630.jpg"] = ogDims;
  if (ogDims.width !== OG_WIDTH || ogDims.height !== OG_HEIGHT) {
    throw new ImageValidationError(
      `og-1200x630.jpg must be exactly ${OG_WIDTH}x${OG_HEIGHT} pixels`,
    );
  }

  return dimensions;
}

export async function persistPrebuiltImageVariants(
  input: PrebuiltImageVariantsInput,
  options: PersistPrebuiltOptions = {},
): Promise<ProcessedImageResult> {
  const dimensions = validatePrebuiltVariants(input);
  const original = dimensions["original.jpg"];

  const result: ProcessedImageResult = {
    imageId: input.imageId,
    variants: input.variants,
    metadata: {
      width: original.width,
      height: original.height,
      source: options.source ?? "UPLOAD",
      sourceUrl: options.sourceUrl ?? null,
    },
  };

  if (options.skipUpload) {
    return result;
  }

  const env = readS3Env();
  const client = createS3Client(env);
  try {
    await uploadImageVariants(result.imageId, result.variants, client, env.bucket);
  } catch (error) {
    try {
      await deleteImageObjects(result.imageId, client, env.bucket);
    } catch {
      // Best-effort cleanup after a partial upload failure.
    }
    throw error;
  }

  return result;
}
