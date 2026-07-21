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
  const file = new File([blob], filename, { type: "image/jpeg" });
  const transfer = new DataTransfer();
  transfer.items.add(file);
  input.files = transfer.files;
}

export function mapClientImageError(error: unknown, fallbackMessage: string): string {
  if (error instanceof ImageValidationError && error.message.trim().length > 0) {
    return error.message;
  }
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }
  return fallbackMessage;
}

export type { VariantFilename };
export { VARIANT_FILENAMES };
