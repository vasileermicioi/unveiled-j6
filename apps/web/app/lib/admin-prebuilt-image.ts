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

function looksLikeWebp(buffer: Buffer): boolean {
  return (
    buffer.length >= 12 &&
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  );
}

async function readVariantBuffer(
  body: ParsedBody,
  asString: AsString,
  asFile: AsFile,
  fieldPrefix: string,
  filename: VariantFilename,
): Promise<Buffer | null> {
  const file = asFile(body[`${fieldPrefix}${filename}`]);
  let fileBuffer: Buffer | null = null;
  if (file && file.size > 0) {
    fileBuffer = Buffer.from(await file.arrayBuffer());
    if (looksLikeWebp(fileBuffer)) {
      return fileBuffer;
    }
  }

  const b64 = asString(body[`${fieldPrefix}${filename}__b64`])?.trim();
  if (b64) {
    try {
      const fromB64 = Buffer.from(b64, "base64");
      if (fromB64.length > 0) {
        return fromB64;
      }
    } catch {
      // fall through
    }
  }

  return fileBuffer && fileBuffer.length > 0 ? fileBuffer : null;
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
    const buffer = await readVariantBuffer(body, asString, asFile, fieldPrefix, filename);
    if (!buffer || buffer.length <= 0) {
      return null;
    }
    variants[filename] = buffer;
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
 * Returns a complete prebuilt variant set when `imageId` and all five
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
  return parseIdListFromQuery(values);
}

/**
 * Parses repeated (or single) `partnerIds` form fields into a de-duplicated string list.
 */
export function parseFeaturedPartnerIds(body: ParsedBody, asString: AsString): string[] {
  const raw = body.partnerIds;
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

/** Parses `partnerIds` from a query string (repeated keys and/or comma-separated). */
export function parseFeaturedPartnerIdsFromQuery(values: string | string[] | undefined): string[] {
  return parseIdListFromQuery(values);
}

/**
 * Parses repeated (or single) `eventIds` form fields into a de-duplicated string list.
 */
export function parseFeaturedEventIds(body: ParsedBody, asString: AsString): string[] {
  const raw = body.eventIds;
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

/** Parses `eventIds` from a query string (repeated keys and/or comma-separated). */
export function parseFeaturedEventIdsFromQuery(values: string | string[] | undefined): string[] {
  return parseIdListFromQuery(values);
}

function parseIdListFromQuery(values: string | string[] | undefined): string[] {
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
