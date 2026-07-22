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

function galleryFieldKey(index: number, suffix: string): string {
  return `gallery[${index}].${suffix}`;
}

async function parsePrebuiltSetFromFields(
  body: ParsedBody,
  asString: AsString,
  asFile: AsFile,
  fieldPrefix: string,
): Promise<PrebuiltImageVariantsInput | null> {
  const imageId = asString(body[`${fieldPrefix}imageId`])?.trim();
  if (!imageId) {
    return null;
  }

  const variants = {} as Record<VariantFilename, Buffer>;

  for (const filename of VARIANT_FILENAMES) {
    const file = asFile(body[`${fieldPrefix}${filename}`]);
    if (!file || file.size <= 0) {
      return null;
    }
    variants[filename] = Buffer.from(await file.arrayBuffer());
  }

  const claimedWidth = parseOptionalPositiveInt(asString(body[`${fieldPrefix}claimedWidth`]));
  const claimedHeight = parseOptionalPositiveInt(asString(body[`${fieldPrefix}claimedHeight`]));

  return {
    imageId,
    variants,
    ...(claimedWidth !== undefined ? { claimedWidth } : {}),
    ...(claimedHeight !== undefined ? { claimedHeight } : {}),
  };
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
  return parsePrebuiltSetFromFields(body, asString, asFile, "");
}

/**
 * Parses indexed gallery prebuilt sets from `galleryCount` + `gallery[i].…` fields.
 * Returns [] when count is missing/invalid or any indexed set is incomplete.
 */
export async function parsePrebuiltImageVariantSets(
  body: ParsedBody,
  asString: AsString,
  asFile: AsFile,
): Promise<PrebuiltImageVariantsInput[]> {
  const countRaw = asString(body.galleryCount)?.trim();
  if (!countRaw) {
    return [];
  }
  const count = Number.parseInt(countRaw, 10);
  if (!Number.isFinite(count) || count < 1) {
    return [];
  }

  const sets: PrebuiltImageVariantsInput[] = [];
  for (let index = 0; index < count; index += 1) {
    const parsed = await parsePrebuiltSetFromFields(
      body,
      asString,
      asFile,
      galleryFieldKey(index, ""),
    );
    if (!parsed) {
      return [];
    }
    sets.push(parsed);
  }
  return sets;
}

/**
 * Parses repeated (or single) `imageIds` form fields into a de-duplicated string list.
 */
export function parseGalleryImageIds(body: ParsedBody, asString: AsString): string[] {
  const raw = body.imageIds;
  if (raw === undefined) {
    return [];
  }

  const values = Array.isArray(raw) ? raw : [raw];
  const ids: string[] = [];
  const seen = new Set<string>();

  for (const value of values) {
    const id = asString(value)?.trim();
    if (!id || seen.has(id)) {
      continue;
    }
    seen.add(id);
    ids.push(id);
  }

  return ids;
}

/** Parses `imageIds` from a query string (repeated keys and/or comma-separated). */
export function parseGalleryImageIdsFromQuery(values: string | string[] | undefined): string[] {
  if (values === undefined) {
    return [];
  }
  const list = Array.isArray(values) ? values : [values];
  const ids: string[] = [];
  const seen = new Set<string>();

  for (const entry of list) {
    for (const part of entry.split(",")) {
      const id = part.trim();
      if (!id || seen.has(id)) {
        continue;
      }
      seen.add(id);
      ids.push(id);
    }
  }

  return ids;
}
