import {
  type ClientGenerateVariantsOptions,
  type ClientProcessedImageResult,
  generateImageVariantsClient,
  ImageValidationError,
  VARIANT_FILENAMES,
  type VariantFilename,
} from "@unveiled/images/client";

export type ProcessedAdminUpload = {
  imageId: string;
  claimedWidth: number;
  claimedHeight: number;
  variants: Record<VariantFilename, Blob>;
  sourceFileName: string;
};

export type ClientImageErrorKind = "undecodable" | "webp_unsupported" | "incomplete" | "generic";

export type AdminImageErrorCopy = {
  imageUndecodableError: string;
  imageWebpUnsupportedError: string;
  imageIncompleteVariantsError: string;
  imageProcessingError: string;
};

function toProcessedUpload(
  generated: ClientProcessedImageResult,
  sourceFileName: string,
): ProcessedAdminUpload {
  return {
    imageId: generated.imageId,
    claimedWidth: generated.metadata.width,
    claimedHeight: generated.metadata.height,
    variants: generated.variants,
    sourceFileName,
  };
}

/**
 * Process one or more source files into product variant sets.
 * When `multiple` is false, only the first file is used (primary event image).
 */
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
    results.push(toProcessedUpload(generated, file.name));
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
  return toProcessedUpload(generated, options.sourceFileName ?? "remote-image");
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
