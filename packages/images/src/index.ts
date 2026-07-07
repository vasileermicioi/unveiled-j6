import { REMOTE_FETCH_TIMEOUT_MS } from "./constants";
import {
  type GenerateVariantsOptions,
  generateImageVariants,
  type ProcessedImageResult,
} from "./process";
import { createS3Client, imageObjectsExist, readS3Env, uploadImageVariants } from "./s3";
import { ImageValidationError, validateRemoteContentType } from "./validation";

export type ProcessImageOptions = {
  uploadedBy?: string | null;
  skipUpload?: boolean;
  imageId?: string;
};

export {
  ACCEPTED_MIME_TYPES,
  type AcceptedMimeType,
  MAX_UPLOAD_BYTES,
  MIN_IMAGE_HEIGHT,
  MIN_IMAGE_WIDTH,
  VARIANT_FILENAMES,
  type VariantFilename,
} from "./constants";
export type { ImageSource, ProcessedImageMetadata, ProcessedImageResult } from "./process";
export {
  generateImageVariants,
  getVariantDimensions,
} from "./process";
export {
  createS3Client,
  deleteImageObjects,
  imageObjectsExist,
  readS3Env,
  type S3Env,
  uploadImageVariants,
} from "./s3";
export { buildVariantUrl, readImagePublicBaseUrl } from "./urls";
export { ImageValidationError, validateImageBuffer } from "./validation";

async function processValidatedBuffer(
  buffer: Buffer,
  options: GenerateVariantsOptions & ProcessImageOptions,
): Promise<ProcessedImageResult> {
  const result = await generateImageVariants(buffer, options);

  if (!options.skipUpload) {
    const env = readS3Env();
    const client = createS3Client(env);
    await uploadImageVariants(result.imageId, result.variants, client, env.bucket);
  }

  return result;
}

export async function processImageFromBuffer(
  buffer: Buffer,
  options: ProcessImageOptions = {},
): Promise<ProcessedImageResult> {
  return processValidatedBuffer(buffer, {
    source: "UPLOAD",
    sourceUrl: null,
    imageId: options.imageId,
    skipUpload: options.skipUpload,
  });
}

export async function processImageFromUrl(
  url: string,
  options: ProcessImageOptions = {},
): Promise<ProcessedImageResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REMOTE_FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new ImageValidationError(`Failed to fetch image URL (${response.status})`);
    }

    validateRemoteContentType(response.headers.get("content-type"));

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return processValidatedBuffer(buffer, {
      source: "REMOTE_URL",
      sourceUrl: url,
      imageId: options.imageId,
      skipUpload: options.skipUpload,
    });
  } catch (error) {
    if (error instanceof ImageValidationError) {
      throw error;
    }
    if (error instanceof Error && error.name === "AbortError") {
      throw new ImageValidationError("Timed out fetching remote image URL");
    }
    throw new ImageValidationError("Failed to fetch remote image URL");
  } finally {
    clearTimeout(timeout);
  }
}

/** Re-upload variants when the DB row exists but bucket objects are missing (e.g. seed before R2). */
export async function repairImageVariants(imageId: string, sourceUrl: string): Promise<void> {
  if (await imageObjectsExist(imageId)) {
    return;
  }

  await processImageFromUrl(sourceUrl, { imageId });
}
