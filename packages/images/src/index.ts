import { imageObjectsExist } from "./s3";

export {
  ACCEPTED_IMAGE_FILE_ACCEPT,
  ACCEPTED_MIME_TYPES,
  type AcceptedMimeType,
  MAX_UPLOAD_BYTES,
  MIN_IMAGE_HEIGHT,
  MIN_IMAGE_WIDTH,
  REMOTE_FETCH_TIMEOUT_MS,
  VARIANT_FILENAMES,
  type VariantFilename,
} from "./constants";
export { ImageValidationError, validateRemoteContentType } from "./errors";
export {
  isJpegBuffer,
  type JpegDimensions,
  readJpegDimensions,
  requireJpegDimensions,
} from "./jpeg-dimensions";
export {
  type PersistPrebuiltOptions,
  type PrebuiltImageVariantsInput,
  type PrebuiltVariantDimensions,
  persistPrebuiltImageVariants,
  validatePrebuiltVariants,
} from "./prebuilt";
export {
  assertSafeRemoteImageUrl,
  type FetchedRemoteImage,
  fetchRemoteImageBytes,
  isAcceptedImageContentType,
  REMOTE_IMAGE_USER_AGENT,
} from "./remote-fetch";
export {
  createS3Client,
  deleteImageObjects,
  imageObjectsExist,
  readS3Env,
  type S3Env,
  uploadImageVariants,
} from "./s3";
export type { ImageSource, ProcessedImageMetadata, ProcessedImageResult } from "./types";
export { buildVariantUrl, readImagePublicBaseUrl } from "./urls";
export { validateImageBuffer } from "./validation";

/**
 * Best-effort check that variant objects exist. Does not re-fetch or resize —
 * admins must re-upload if objects are missing.
 */
export async function ensureImageObjectsPresent(imageId: string): Promise<boolean> {
  return imageObjectsExist(imageId);
}
