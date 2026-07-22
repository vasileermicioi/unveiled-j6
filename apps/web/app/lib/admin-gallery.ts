import type { EventGalleryImageRow } from "@unveiled/db";
import { buildVariantUrl } from "@unveiled/images/urls";

import type { AdminGalleryListItem } from "../components/admin/AdminEventGalleryListPage";

export function toAdminGalleryListItems(rows: EventGalleryImageRow[]): AdminGalleryListItem[] {
  return rows.map((row) => {
    let thumbnailUrl: string | null = null;
    try {
      thumbnailUrl = buildVariantUrl(row.imageId, "small-320.jpg");
    } catch {
      thumbnailUrl = null;
    }
    return { ...row, thumbnailUrl };
  });
}
