import { buildVariantUrl } from "@unveiled/images/urls";

type EventWithImage = {
  id: string;
  imageId: string;
};

export function buildEventImageUrls(events: EventWithImage[]): Record<string, string | undefined> {
  const imageUrls: Record<string, string | undefined> = {};

  for (const event of events) {
    try {
      imageUrls[event.id] = buildVariantUrl(event.imageId, "small-320.webp");
    } catch {
      imageUrls[event.id] = undefined;
    }
  }

  return imageUrls;
}
