import { and, asc, count, eq, inArray, max } from "drizzle-orm";

import type { Db } from "../index";
import { eventGalleryImages } from "../schema/event-gallery-images";
import { events } from "../schema/events";
import { images } from "../schema/images";
import { partners } from "../schema/partners";
import { CatalogValidationError } from "./errors";
import { getEventById } from "./events";

export const MAX_EVENT_GALLERY_IMAGES = 12;

export type EventGalleryImageRow = {
  eventId: string;
  imageId: string;
  sortOrder: number;
  createdAt: Date;
};

export type RemoveEventGalleryImagesOptions = {
  skipBucket?: boolean;
};

function catalogImages() {
  return import("./images");
}

export async function listEventGalleryImages(
  db: Db,
  eventId: string,
): Promise<EventGalleryImageRow[]> {
  return db
    .select({
      eventId: eventGalleryImages.eventId,
      imageId: eventGalleryImages.imageId,
      sortOrder: eventGalleryImages.sortOrder,
      createdAt: eventGalleryImages.createdAt,
    })
    .from(eventGalleryImages)
    .where(eq(eventGalleryImages.eventId, eventId))
    .orderBy(asc(eventGalleryImages.sortOrder), asc(eventGalleryImages.imageId));
}

export async function listEventGalleryImageIds(db: Db, eventId: string): Promise<string[]> {
  const rows = await listEventGalleryImages(db, eventId);
  return rows.map((row) => row.imageId);
}

async function isImageReferenced(db: Db, imageId: string): Promise<boolean> {
  const [asHero] = await db
    .select({ id: events.id })
    .from(events)
    .where(eq(events.imageId, imageId))
    .limit(1);
  if (asHero) {
    return true;
  }

  const [asLogo] = await db
    .select({ id: partners.id })
    .from(partners)
    .where(eq(partners.logoImageId, imageId))
    .limit(1);
  if (asLogo) {
    return true;
  }

  const [asGallery] = await db
    .select({ eventId: eventGalleryImages.eventId })
    .from(eventGalleryImages)
    .where(eq(eventGalleryImages.imageId, imageId))
    .limit(1);
  return Boolean(asGallery);
}

export async function addEventGalleryImages(
  db: Db,
  eventId: string,
  imageIds: string[],
): Promise<EventGalleryImageRow[]> {
  const event = await getEventById(db, eventId);
  if (!event) {
    throw new CatalogValidationError("EVENT_NOT_FOUND", `Event ${eventId} not found`);
  }

  if (imageIds.length === 0) {
    return listEventGalleryImages(db, eventId);
  }

  const uniqueIncoming = [...new Set(imageIds)];
  if (uniqueIncoming.length !== imageIds.length) {
    throw new CatalogValidationError(
      "GALLERY_DUPLICATE_IMAGE",
      "Duplicate image ids in gallery add request",
    );
  }

  // Catalog helpers use neon-http (`createDb`); no interactive transactions here.
  const existing = await db
    .select({
      imageId: eventGalleryImages.imageId,
      sortOrder: eventGalleryImages.sortOrder,
    })
    .from(eventGalleryImages)
    .where(eq(eventGalleryImages.eventId, eventId));

  const existingIds = new Set(existing.map((row) => row.imageId));
  for (const imageId of uniqueIncoming) {
    if (existingIds.has(imageId)) {
      throw new CatalogValidationError(
        "GALLERY_DUPLICATE_IMAGE",
        `Image ${imageId} is already in the gallery for event ${eventId}`,
      );
    }
  }

  if (existing.length + uniqueIncoming.length > MAX_EVENT_GALLERY_IMAGES) {
    throw new CatalogValidationError(
      "GALLERY_LIMIT_EXCEEDED",
      `Event gallery cannot exceed ${MAX_EVENT_GALLERY_IMAGES} images`,
    );
  }

  const imageRows = await db
    .select({ id: images.id })
    .from(images)
    .where(inArray(images.id, uniqueIncoming));
  if (imageRows.length !== uniqueIncoming.length) {
    throw new CatalogValidationError(
      "MISSING_EVENT_IMAGE",
      "One or more gallery image ids do not exist",
    );
  }

  const [maxRow] = await db
    .select({ maxSort: max(eventGalleryImages.sortOrder) })
    .from(eventGalleryImages)
    .where(eq(eventGalleryImages.eventId, eventId));
  let nextSort = (maxRow?.maxSort ?? -1) + 1;

  const values = uniqueIncoming.map((imageId) => {
    const sortOrder = nextSort;
    nextSort += 1;
    return { eventId, imageId, sortOrder };
  });

  await db.insert(eventGalleryImages).values(values);

  return listEventGalleryImages(db, eventId);
}

/**
 * Persist a new gallery order. `orderedImageIds` must be a permutation of the
 * current membership (same set, same length). Writes `sort_order` as 0..n-1.
 */
export async function reorderEventGalleryImages(
  db: Db,
  eventId: string,
  orderedImageIds: string[],
): Promise<EventGalleryImageRow[]> {
  const event = await getEventById(db, eventId);
  if (!event) {
    throw new CatalogValidationError("EVENT_NOT_FOUND", `Event ${eventId} not found`);
  }

  const existing = await listEventGalleryImages(db, eventId);
  const existingIds = existing.map((row) => row.imageId);

  if (orderedImageIds.length === 0 && existingIds.length === 0) {
    return [];
  }

  const uniqueOrdered = [...new Set(orderedImageIds)];
  if (
    uniqueOrdered.length !== orderedImageIds.length ||
    uniqueOrdered.length !== existingIds.length
  ) {
    throw new CatalogValidationError(
      "GALLERY_REORDER_INVALID",
      "Gallery reorder must include each current image id exactly once",
    );
  }

  const existingSet = new Set(existingIds);
  for (const imageId of uniqueOrdered) {
    if (!existingSet.has(imageId)) {
      throw new CatalogValidationError(
        "GALLERY_REORDER_INVALID",
        `Image ${imageId} is not in the gallery for event ${eventId}`,
      );
    }
  }

  // Temporary high offsets avoid unique (event_id, sort_order) collisions mid-update
  // when a unique index is present; sequential writes are fine for neon-http.
  const tempBase = MAX_EVENT_GALLERY_IMAGES + 100;
  for (let i = 0; i < uniqueOrdered.length; i += 1) {
    const imageId = uniqueOrdered[i];
    if (!imageId) {
      continue;
    }
    await db
      .update(eventGalleryImages)
      .set({ sortOrder: tempBase + i })
      .where(and(eq(eventGalleryImages.eventId, eventId), eq(eventGalleryImages.imageId, imageId)));
  }

  for (let i = 0; i < uniqueOrdered.length; i += 1) {
    const imageId = uniqueOrdered[i];
    if (!imageId) {
      continue;
    }
    await db
      .update(eventGalleryImages)
      .set({ sortOrder: i })
      .where(and(eq(eventGalleryImages.eventId, eventId), eq(eventGalleryImages.imageId, imageId)));
  }

  return listEventGalleryImages(db, eventId);
}

export async function removeEventGalleryImages(
  db: Db,
  eventId: string,
  imageIds: string[],
  options: RemoveEventGalleryImagesOptions = {},
): Promise<void> {
  if (imageIds.length === 0) {
    return;
  }

  const uniqueIds = [...new Set(imageIds)];

  const removed = await db
    .delete(eventGalleryImages)
    .where(
      and(eq(eventGalleryImages.eventId, eventId), inArray(eventGalleryImages.imageId, uniqueIds)),
    )
    .returning({ imageId: eventGalleryImages.imageId });

  if (removed.length === 0) {
    return;
  }

  const { deleteImageRecord } = await catalogImages();
  for (const { imageId } of removed) {
    if (await isImageReferenced(db, imageId)) {
      continue;
    }
    await deleteImageRecord(db, imageId, { skipBucket: options.skipBucket });
  }
}

export async function countEventGalleryImages(db: Db, eventId: string): Promise<number> {
  const [result] = await db
    .select({ count: count() })
    .from(eventGalleryImages)
    .where(eq(eventGalleryImages.eventId, eventId));
  return result?.count ?? 0;
}
