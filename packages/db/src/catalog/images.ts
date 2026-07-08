import { eq } from "drizzle-orm";

import type { Db } from "../index";
import { images } from "../schema/images";
import { CatalogValidationError } from "./errors";
import { type ImageAttachInput, validateImageSourceExclusive } from "./validation";

export type PersistImageOptions = {
  uploadedBy?: string | null;
  skipUpload?: boolean;
};

const IMAGE_PROCESSING_UNAVAILABLE =
  "Image processing is not available on this host. Upload images using local development (bun run dev) or seed data with bun run seed:demo.";

type ImagesModule = typeof import("@unveiled/images");

async function loadImagesModule(): Promise<ImagesModule> {
  try {
    return await import(/* @vite-ignore */ "@unveiled/images");
  } catch {
    throw new CatalogValidationError("IMAGE_PROCESSING_UNAVAILABLE", IMAGE_PROCESSING_UNAVAILABLE);
  }
}

export async function persistImageFromSource(
  db: Db,
  source: ImageAttachInput,
  options: PersistImageOptions = {},
): Promise<string> {
  const imagesModule = await loadImagesModule();
  const processed =
    source.type === "upload"
      ? await imagesModule.processImageFromBuffer(source.buffer, {
          uploadedBy: options.uploadedBy,
          skipUpload: options.skipUpload,
        })
      : await imagesModule.processImageFromUrl(source.url, {
          uploadedBy: options.uploadedBy,
          skipUpload: options.skipUpload,
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

export async function attachImageToPartner(
  db: Db,
  _partnerId: string,
  upload?: Buffer | null,
  url?: string | null,
  options: PersistImageOptions = {},
): Promise<string> {
  const source = validateImageSourceExclusive(upload, url, { required: true });
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
  const source = validateImageSourceExclusive(upload, url, { required: true });
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
    const imagesModule = await loadImagesModule();
    await imagesModule.deleteImageObjects(imageId);
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
  const source = validateImageSourceExclusive(upload, url);
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
  const source = validateImageSourceExclusive(upload, url);
  if (!source) {
    return currentImageId;
  }

  return persistImageFromSource(db, source, options);
}

export async function ensureImageVariantsUploaded(db: Db, imageId: string): Promise<void> {
  const row = await db.query.images.findFirst({
    where: eq(images.id, imageId),
  });

  if (!row?.sourceUrl) {
    return;
  }

  try {
    const imagesModule = await loadImagesModule();
    await imagesModule.repairImageVariants(imageId, row.sourceUrl);
  } catch {
    // Workers and other hosts without sharp skip repair; list/detail still use existing URLs.
  }
}
