import { imageObjectsExist } from "./s3";

export {
  ACCEPTED_IMAGE_FILE_ACCEPT,
  LEGACY_JPEG_VARIANT_FILENAMES,
  REMOTE_FETCH_MAX_BYTES,
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
  createPrivateS3Client,
  createS3Client,
  deleteImageObjects,
  type GetObjectInput,
  getObject,
  getPrivateObject,
  imageObjectsExist,
  normalizeS3Endpoint,
  readPrivateS3Env,
  readS3Env,
  type S3Env,
  type UploadObjectInput,
  uploadImageVariants,
  uploadObject,
  uploadPrivateObject,
} from "./s3";
export type { ImageSource, ProcessedImageMetadata, ProcessedImageResult } from "./types";
export { buildVariantUrl, readImagePublicBaseUrl } from "./urls";
export { validateImageBuffer } from "./validation";
export {
  isWebpBuffer,
  readWebpDimensions,
  requireWebpDimensions,
  type WebpDimensions,
} from "./webp-dimensions";

/**
 * Best-effort check that variant objects exist. Does not re-fetch or resize —
 * admins must re-upload if objects are missing.
 */
export async function ensureImageObjectsPresent(imageId: string): Promise<boolean> {
  return imageObjectsExist(imageId);
}
