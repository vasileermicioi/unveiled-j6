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

export type PersistImageOptions = {
  uploadedBy?: string | null;
  skipUpload?: boolean;
  prebuilt?: PrebuiltImageVariantsInput | null;
  /** Optional remote origin when prebuilt variants were generated from a URL. */
  sourceUrl?: string | null;
};

export type PersistPrebuiltImageOptions = PersistImageOptions &
  Pick<PersistPrebuiltOptions, "source" | "sourceUrl">;

/** Persist a client-built six-variant set (no server resize). */
export async function persistPrebuiltImage(
  db: Db,
  input: PrebuiltImageVariantsInput,
  options: PersistPrebuiltImageOptions = {},
): Promise<string> {
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

export async function replacePartnerLogo(
  db: Db,
  _partnerId: string,
  currentLogoImageId: string | null,
  upload?: Buffer | null,
  url?: string | null,
  options: PersistImageOptions = {},
): Promise<string | null> {
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
