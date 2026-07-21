import { VARIANT_FILENAMES, type VariantFilename } from "../constants";
import type { PrebuiltImageVariantsInput } from "../prebuilt";
import "../client/test-env";
import {
  type ClientGenerateVariantsOptions,
  generateImageVariantsClient,
} from "../client/generate-variants";

/**
 * Bun/test-only: run the Pica client generator against a source buffer.
 * Do not import from Workers/server route modules.
 */
export async function bufferToPrebuiltVariants(
  buffer: Buffer,
  options: ClientGenerateVariantsOptions = {},
): Promise<PrebuiltImageVariantsInput> {
  // Omit Content-Type so decode/createImageBitmap can sniff JPEG/PNG/WebP.
  const blob = new Blob([Uint8Array.from(buffer)]);
  const generated = await generateImageVariantsClient(blob, options);
  const variants = {} as Record<VariantFilename, Buffer>;

  for (const filename of VARIANT_FILENAMES) {
    const variantBlob = generated.variants[filename];
    variants[filename] = Buffer.from(await variantBlob.arrayBuffer());
  }

  return {
    imageId: generated.imageId,
    variants,
    claimedWidth: generated.metadata.width,
    claimedHeight: generated.metadata.height,
  };
}
