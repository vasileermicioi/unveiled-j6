import {
  type ClientGenerateVariantsOptions,
  type ClientProcessedImageResult,
  generateImageVariantsClient,
  ImageValidationError,
  isWebpBuffer,
  VARIANT_FILENAMES,
  type VariantFilename,
} from "@unveiled/images/client";

export type ProcessedAdminUpload = {
  imageId: string;
  claimedWidth: number;
  claimedHeight: number;
  variants: Record<VariantFilename, Blob>;
  /** Base64 WebP bytes for reliable SSR multipart when file inputs drop programmatic blobs. */
  variantsBase64: Record<VariantFilename, string>;
  sourceFileName: string;
};

async function blobToBase64(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

export type ClientImageErrorKind = "undecodable" | "webp_unsupported" | "incomplete" | "generic";

export type AdminImageErrorCopy = {
  imageUndecodableError: string;
  imageWebpUnsupportedError: string;
  imageIncompleteVariantsError: string;
  imageProcessingError: string;
};

async function toProcessedUpload(
  generated: ClientProcessedImageResult,
  sourceFileName: string,
): Promise<ProcessedAdminUpload> {
  const variantsBase64 = {} as Record<VariantFilename, string>;
  for (const filename of VARIANT_FILENAMES) {
    variantsBase64[filename] = await blobToBase64(generated.variants[filename]);
  }
  return {
    imageId: generated.imageId,
    claimedWidth: generated.metadata.width,
    claimedHeight: generated.metadata.height,
    variants: generated.variants,
    variantsBase64,
    sourceFileName,
  };
}

/**
 * Process one or more source files into product variant sets.
 * When `multiple` is false, only the first file is used (primary event image).
 */
async function assertVariantsAreWebp(variants: Record<VariantFilename, Blob>): Promise<void> {
  for (const filename of VARIANT_FILENAMES) {
    const blob = variants[filename];
    if (!(blob instanceof Blob) || blob.size <= 0) {
      throw new ImageValidationError(`Missing required variant: ${filename}`);
    }
    const bytes = new Uint8Array(await blob.arrayBuffer());
    if (!isWebpBuffer(bytes)) {
      throw new ImageValidationError("WebP WASM encoder produced non-WebP output");
    }
  }
}

export async function processAdminImageFiles(
  files: File[],
  options: { multiple?: boolean } = {},
): Promise<ProcessedAdminUpload[]> {
  const selected = options.multiple ? files : files.slice(0, 1);
  const results: ProcessedAdminUpload[] = [];

  for (const file of selected) {
    const generated: ClientProcessedImageResult = await generateImageVariantsClient(file, {
      source: "UPLOAD",
    });
    await assertVariantsAreWebp(generated.variants);
    results.push(await toProcessedUpload(generated, file.name));
  }

  return results;
}

/** Process a single blob (e.g. bytes from the admin image proxy). */
export async function processAdminImageBlob(
  blob: Blob,
  options: ClientGenerateVariantsOptions & { sourceFileName?: string } = {},
): Promise<ProcessedAdminUpload> {
  const generated = await generateImageVariantsClient(blob, {
    source: options.source ?? "UPLOAD",
    sourceUrl: options.sourceUrl,
    imageId: options.imageId,
  });
  await assertVariantsAreWebp(generated.variants);
  return await toProcessedUpload(generated, options.sourceFileName ?? "remote-image");
}

/** Multipart companion field: base64 WebP bytes when programmatic file inputs are stripped. */
export function variantBase64FieldName(fieldPrefix: string, filename: VariantFilename): string {
  return `${fieldPrefix}${filename}__b64`;
}

function draftFieldString(
  fields: Record<string, string | string[]>,
  name: string,
): string | undefined {
  const value = fields[name];
  if (value === undefined) {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
}

function base64ToWebpBlob(base64: string): Blob | null {
  try {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    if (bytes.byteLength === 0) {
      return null;
    }
    return new Blob([bytes], { type: "image/webp" });
  } catch {
    return null;
  }
}

/** Rebuild a processed upload from named hidden draft fields. Incomplete sets return null. */
export function processedUploadFromDraftFields(
  fields: Record<string, string | string[]>,
  fieldPrefix = "",
): ProcessedAdminUpload | null {
  const imageId = draftFieldString(fields, `${fieldPrefix}imageId`)?.trim();
  const widthRaw = draftFieldString(fields, `${fieldPrefix}claimedWidth`);
  const heightRaw = draftFieldString(fields, `${fieldPrefix}claimedHeight`);
  if (!imageId || widthRaw === undefined || heightRaw === undefined) {
    return null;
  }
  const claimedWidth = Number(widthRaw);
  const claimedHeight = Number(heightRaw);
  if (!Number.isFinite(claimedWidth) || !Number.isFinite(claimedHeight)) {
    return null;
  }

  const variants = {} as Record<VariantFilename, Blob>;
  const variantsBase64 = {} as Record<VariantFilename, string>;
  for (const filename of VARIANT_FILENAMES) {
    const encoded = draftFieldString(fields, variantBase64FieldName(fieldPrefix, filename));
    if (!encoded?.trim()) {
      return null;
    }
    const blob = base64ToWebpBlob(encoded);
    if (!blob) {
      return null;
    }
    variants[filename] = blob;
    variantsBase64[filename] = encoded;
  }

  return {
    imageId,
    claimedWidth,
    claimedHeight,
    variants,
    variantsBase64,
    sourceFileName: "draft-restore",
  };
}

/** Rebuild gallery prebuilt sets from `galleryCount` + `gallery[i].*` hidden fields. */
export function processedGalleryUploadsFromDraftFields(
  fields: Record<string, string | string[]>,
): ProcessedAdminUpload[] {
  const countRaw = draftFieldString(fields, "galleryCount");
  const count = Number(countRaw);
  if (!Number.isInteger(count) || count < 1) {
    return [];
  }
  const result: ProcessedAdminUpload[] = [];
  for (let index = 0; index < count; index += 1) {
    const item = processedUploadFromDraftFields(fields, `gallery[${index}].`);
    if (!item) {
      return [];
    }
    result.push(item);
  }
  return result;
}

export function assignBlobToFileInput(input: HTMLInputElement, filename: string, blob: Blob): void {
  const file = new File([blob], filename, { type: blob.type || "image/webp" });
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
}

export function hasCompleteVariants(processed: ProcessedAdminUpload): boolean {
  return VARIANT_FILENAMES.every((filename) => {
    const blob = processed.variants[filename];
    return blob instanceof Blob && blob.size > 0;
  });
}

export function classifyClientImageError(error: unknown): ClientImageErrorKind {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const lower = message.toLowerCase();

  if (
    lower.includes("webp encoding is not supported") ||
    lower.includes("webp encoding failed") ||
    lower.includes("wasm encoder") ||
    lower.includes("canvas.toblob image/webp")
  ) {
    return "webp_unsupported";
  }

  if (
    lower.includes("missing required variant") ||
    lower.includes("incomplete") ||
    lower.includes("variant set")
  ) {
    return "incomplete";
  }

  if (
    lower.includes("unable to read image") ||
    lower.includes("must be an image") ||
    lower.includes("format is not recognized") ||
    lower.includes("image file is empty") ||
    lower.includes("decode")
  ) {
    return "undecodable";
  }

  if (error instanceof ImageValidationError) {
    return "generic";
  }

  return "generic";
}

export function mapClientImageError(error: unknown, copy: AdminImageErrorCopy): string {
  switch (classifyClientImageError(error)) {
    case "webp_unsupported":
      return copy.imageWebpUnsupportedError;
    case "undecodable":
      return copy.imageUndecodableError;
    case "incomplete":
      return copy.imageIncompleteVariantsError;
    default:
      return copy.imageProcessingError;
  }
}

/** Human-readable size label without the `.webp` suffix. */
export function variantSizeLabel(filename: VariantFilename): string {
  return filename.replace(/\.webp$/i, "");
}

export type { VariantFilename };
export { VARIANT_FILENAMES };
