import {
  deleteImageObjects,
  ensureImageObjectsPresent,
  type PersistPrebuiltOptions,
  type PrebuiltImageVariantsInput,
  persistPrebuiltImageVariants,
} from "@unveiled/images";
import { eq } from "drizzle-orm";

import type { Db } from "../index";
import { images } from "../schema/images";
import { CatalogValidationError } from "./errors";
import { type ImageAttachInput, validateImageSourceExclusive } from "./validation";

export const IMAGE_CREDIT_MAX_LENGTH = 200;

export type PersistImageOptions = {
  uploadedBy?: string | null;
  skipUpload?: boolean;
  prebuilt?: PrebuiltImageVariantsInput | null;
  /** Optional remote origin when prebuilt variants were generated from a URL. */
  sourceUrl?: string | null;
  /** Optional human photo credit; independent of pipeline `source` / `source_url`. */
  credit?: string | null;
};

/** Trim; empty/omitted → `null`; reject trimmed length over {@link IMAGE_CREDIT_MAX_LENGTH}. */
export function normalizeImageCredit(credit?: string | null): string | null {
  if (credit == null) {
    return null;
  }
  const trimmed = credit.trim();
  if (trimmed.length === 0) {
    return null;
  }
  if (trimmed.length > IMAGE_CREDIT_MAX_LENGTH) {
    throw new CatalogValidationError(
      "IMAGE_CREDIT_TOO_LONG",
      `Image credit must be ${IMAGE_CREDIT_MAX_LENGTH} characters or fewer`,
    );
  }
  return trimmed;
}

export type PersistPrebuiltImageOptions = PersistImageOptions &
  Pick<PersistPrebuiltOptions, "source" | "sourceUrl">;

/** Persist a client-built five-variant WebP set (no server resize). */
export async function persistPrebuiltImage(
  db: Db,
  input: PrebuiltImageVariantsInput,
  options: PersistPrebuiltImageOptions = {},
): Promise<string> {
  const credit = normalizeImageCredit(options.credit);
  const sourceUrl = options.sourceUrl ?? null;
  const processed = await persistPrebuiltImageVariants(input, {
    skipUpload: options.skipUpload,
    source: options.source ?? (sourceUrl ? "REMOTE_URL" : "UPLOAD"),
    sourceUrl,
  });

  await db.insert(images).values({
    id: processed.imageId,
    originalWidth: processed.metadata.width,
    originalHeight: processed.metadata.height,
    source: processed.metadata.source,
    sourceUrl: processed.metadata.sourceUrl,
    credit,
    uploadedBy: options.uploadedBy ?? null,
  });

  return processed.imageId;
}

export async function persistImageFromSource(
  db: Db,
  source: ImageAttachInput,
  options: PersistImageOptions = {},
): Promise<string> {
  if (source.type !== "prebuilt") {
    throw new CatalogValidationError(
      "CLIENT_IMAGE_REQUIRED",
      "Image variants must be generated in the browser before submit",
    );
  }

  return persistPrebuiltImage(db, source.input, {
    ...options,
    sourceUrl: options.sourceUrl ?? source.sourceUrl ?? null,
    source: (options.sourceUrl ?? source.sourceUrl) ? "REMOTE_URL" : "UPLOAD",
  });
}

export async function attachImageToPartner(
  db: Db,
  _partnerId: string,
  upload?: Buffer | null,
  url?: string | null,
  options: PersistImageOptions = {},
): Promise<string> {
  const source = validateImageSourceExclusive(upload, url, {
    required: true,
    prebuilt: options.prebuilt,
  });
  if (!source) {
    throw new CatalogValidationError("MISSING_EVENT_IMAGE", "Partner logo image is required");
  }

  return persistImageFromSource(db, source, options);
}

export async function attachImageToEvent(
  db: Db,
  upload?: Buffer | null,
  url?: string | null,
  options: PersistImageOptions = {},
): Promise<string> {
  const source = validateImageSourceExclusive(upload, url, {
    required: true,
    prebuilt: options.prebuilt,
  });
  if (!source) {
    throw new CatalogValidationError("MISSING_EVENT_IMAGE", "Event image is required");
  }

  return persistImageFromSource(db, source, options);
}

export async function deleteImageRecord(
  db: Db,
  imageId: string,
  options?: { skipBucket?: boolean },
): Promise<void> {
  if (!options?.skipBucket) {
    await deleteImageObjects(imageId);
  }

  await db.delete(images).where(eq(images.id, imageId));
}

/** Throws when the `images` row is missing (staged/existing primary attach). */
export async function assertImageExists(db: Db, imageId: string): Promise<void> {
  const row = await db.query.images.findFirst({
    where: eq(images.id, imageId),
  });
  if (!row) {
    throw new CatalogValidationError("IMAGE_NOT_FOUND", `Image ${imageId} not found`);
  }
}

export async function getImageCredit(db: Db, imageId: string): Promise<string | null> {
  const row = await db.query.images.findFirst({
    where: eq(images.id, imageId),
    columns: { credit: true },
  });
  if (!row) {
    throw new CatalogValidationError("IMAGE_NOT_FOUND", `Image ${imageId} not found`);
  }
  return row.credit;
}

export async function updateImageCredit(
  db: Db,
  imageId: string,
  credit?: string | null,
): Promise<string | null> {
  const nextCredit = normalizeImageCredit(credit);
  const updated = await db
    .update(images)
    .set({ credit: nextCredit })
    .where(eq(images.id, imageId))
    .returning({ credit: images.credit });
  if (updated.length === 0) {
    throw new CatalogValidationError("IMAGE_NOT_FOUND", `Image ${imageId} not found`);
  }
  return updated[0]?.credit ?? null;
}

export async function replacePartnerLogo(
  db: Db,
  _partnerId: string,
  currentLogoImageId: string,
  upload?: Buffer | null,
  url?: string | null,
  options: PersistImageOptions = {},
): Promise<string> {
  const source = validateImageSourceExclusive(upload, url, { prebuilt: options.prebuilt });
  if (!source) {
    return currentLogoImageId;
  }

  return persistImageFromSource(db, source, options);
}

export async function replaceEventImage(
  db: Db,
  currentImageId: string,
  upload?: Buffer | null,
  url?: string | null,
  options: PersistImageOptions = {},
): Promise<string> {
  const source = validateImageSourceExclusive(upload, url, { prebuilt: options.prebuilt });
  if (!source) {
    return currentImageId;
  }

  return persistImageFromSource(db, source, options);
}

/** Best-effort existence check — does not re-fetch or resize missing objects. */
export async function ensureImageVariantsUploaded(db: Db, imageId: string): Promise<void> {
  const row = await db.query.images.findFirst({
    where: eq(images.id, imageId),
  });

  if (!row) {
    return;
  }

  try {
    await ensureImageObjectsPresent(imageId);
  } catch {
    // Best-effort; list/detail still use existing URLs if R2 is temporarily unavailable.
  }
}
