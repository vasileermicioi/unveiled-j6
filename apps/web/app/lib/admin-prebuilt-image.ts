import {
  type PrebuiltImageVariantsInput,
  VARIANT_FILENAMES,
  type VariantFilename,
} from "@unveiled/images";

export type ParsedBody = Record<string, string | File | (string | File)[]>;

type AsString = (value: string | File | (string | File)[] | undefined) => string | undefined;
type AsFile = (value: string | File | (string | File)[] | undefined) => File | Blob | undefined;

function parseOptionalPositiveInt(value: string | undefined): number | undefined {
  if (!value?.trim()) {
    return undefined;
  }
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return undefined;
  }
  return parsed;
}

/**
 * Returns a complete prebuilt variant set when `imageId` and all six
 * `VARIANT_FILENAMES` file fields are present and non-empty; otherwise null
 * (caller may fall back to legacy single-file / URL paths).
 */
export async function parsePrebuiltImageVariants(
  body: ParsedBody,
  asString: AsString,
  asFile: AsFile,
): Promise<PrebuiltImageVariantsInput | null> {
  const imageId = asString(body.imageId)?.trim();
  if (!imageId) {
    return null;
  }

  const variants = {} as Record<VariantFilename, Buffer>;

  for (const filename of VARIANT_FILENAMES) {
    const file = asFile(body[filename]);
    if (!file || file.size <= 0) {
      return null;
    }
    variants[filename] = Buffer.from(await file.arrayBuffer());
  }

  const claimedWidth = parseOptionalPositiveInt(asString(body.claimedWidth));
  const claimedHeight = parseOptionalPositiveInt(asString(body.claimedHeight));

  return {
    imageId,
    variants,
    ...(claimedWidth !== undefined ? { claimedWidth } : {}),
    ...(claimedHeight !== undefined ? { claimedHeight } : {}),
  };
}
