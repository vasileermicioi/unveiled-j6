import {
  HERO_MAX_WIDTH,
  LARGE_MAX_WIDTH,
  MEDIUM_MAX_WIDTH,
  OG_HEIGHT,
  OG_WIDTH,
  SMALL_MAX_WIDTH,
  VARIANT_FILENAMES,
  type VariantFilename,
} from "./constants";
import { ImageValidationError } from "./errors";
import { createS3Client, deleteImageObjects, readS3Env, uploadImageVariants } from "./s3";
import type { ImageSource, ProcessedImageResult } from "./types";
import { isWebpBuffer, requireWebpDimensions } from "./webp-dimensions";

export type PrebuiltImageVariantsInput = {
  imageId: string;
  variants: Record<VariantFilename, Buffer>;
  /** Client-claimed decoded source size; required for ladder non-upscale checks */
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
  "hero-1920.webp": HERO_MAX_WIDTH,
  "large-1280.webp": LARGE_MAX_WIDTH,
  "medium-640.webp": MEDIUM_MAX_WIDTH,
  "small-320.webp": SMALL_MAX_WIDTH,
} as const;

const LADDER_FILENAMES = [
  "hero-1920.webp",
  "large-1280.webp",
  "medium-640.webp",
  "small-320.webp",
] as const;

function asUint8Array(buffer: Buffer): Uint8Array {
  return buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
}

function requireClaimedSourceDimensions(input: PrebuiltImageVariantsInput): {
  width: number;
  height: number;
} {
  if (
    typeof input.claimedWidth === "number" &&
    typeof input.claimedHeight === "number" &&
    input.claimedWidth >= 1 &&
    input.claimedHeight >= 1
  ) {
    return { width: input.claimedWidth, height: input.claimedHeight };
  }
  throw new ImageValidationError("claimedWidth and claimedHeight are required");
}

export function validatePrebuiltVariants(
  input: PrebuiltImageVariantsInput,
): PrebuiltVariantDimensions {
  if (!input.imageId || typeof input.imageId !== "string") {
    throw new ImageValidationError("imageId is required");
  }

  const sourceDims = requireClaimedSourceDimensions(input);
  const dimensions = {} as PrebuiltVariantDimensions;

  for (const filename of VARIANT_FILENAMES) {
    const buffer = input.variants[filename];
    if (!buffer || buffer.length === 0) {
      throw new ImageValidationError(`Missing required variant: ${filename}`);
    }
    if (!isWebpBuffer(asUint8Array(buffer))) {
      throw new ImageValidationError(`Variant ${filename} must be a WebP image`);
    }
  }

  for (const filename of LADDER_FILENAMES) {
    const dims = requireWebpDimensions(asUint8Array(input.variants[filename]), filename);
    dimensions[filename] = dims;

    const maxWidth = LADDER_MAX_WIDTH[filename];
    if (dims.width > maxWidth) {
      throw new ImageValidationError(
        `Variant ${filename} width ${dims.width} exceeds max ${maxWidth}`,
      );
    }
    if (dims.width > sourceDims.width || dims.height > sourceDims.height) {
      throw new ImageValidationError(
        `Variant ${filename} must not be larger than the claimed source dimensions`,
      );
    }
  }

  const ogDims = requireWebpDimensions(
    asUint8Array(input.variants["og-1200x630.webp"]),
    "og-1200x630.webp",
  );
  dimensions["og-1200x630.webp"] = ogDims;
  if (ogDims.width !== OG_WIDTH || ogDims.height !== OG_HEIGHT) {
    throw new ImageValidationError(
      `og-1200x630.webp must be exactly ${OG_WIDTH}x${OG_HEIGHT} pixels`,
    );
  }

  return dimensions;
}

export async function persistPrebuiltImageVariants(
  input: PrebuiltImageVariantsInput,
  options: PersistPrebuiltOptions = {},
): Promise<ProcessedImageResult> {
  validatePrebuiltVariants(input);
  const sourceDims = requireClaimedSourceDimensions(input);

  const result: ProcessedImageResult = {
    imageId: input.imageId,
    variants: input.variants,
    metadata: {
      width: sourceDims.width,
      height: sourceDims.height,
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
