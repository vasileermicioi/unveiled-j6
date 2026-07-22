import type { EventGalleryImageRow } from "@unveiled/db";
import { buildVariantUrl } from "@unveiled/images/urls";
import { buildCardImageSrc, buildCardImageSrcSet } from "@unveiled/ui";

export type PublicEventGalleryImage = {
  imageId: string;
  sortOrder: number;
  thumbSrc: string;
  thumbSrcSet: string;
  fullSrc: string;
  fullSrcSet: string;
};

function buildGalleryLightboxSrc(imageId: string): string {
  return buildVariantUrl(imageId, "large-1280.jpg");
}

function buildGalleryLightboxSrcSet(imageId: string): string {
  const large = buildVariantUrl(imageId, "large-1280.jpg");
  const medium = buildVariantUrl(imageId, "medium-640.jpg");
  return `${medium} 640w, ${large} 1280w`;
}

/** Map catalog gallery rows to public detail view model; skip rows with broken URLs. */
export function toPublicEventGalleryImages(
  rows: readonly EventGalleryImageRow[],
): PublicEventGalleryImage[] {
  const items: PublicEventGalleryImage[] = [];

  for (const row of rows) {
    try {
      items.push({
        imageId: row.imageId,
        sortOrder: row.sortOrder,
        thumbSrc: buildCardImageSrc(row.imageId),
        thumbSrcSet: buildCardImageSrcSet(row.imageId),
        fullSrc: buildGalleryLightboxSrc(row.imageId),
        fullSrcSet: buildGalleryLightboxSrcSet(row.imageId),
      });
    } catch {
      // Skip broken/missing IMAGE_PUBLIC_BASE_URL or invalid id — never fail the page.
    }
  }

  return items;
}
