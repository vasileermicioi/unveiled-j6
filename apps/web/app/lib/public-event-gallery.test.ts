import { afterEach, describe, expect, test } from "bun:test";
import type { EventGalleryImageRow } from "@unveiled/db";

import { toPublicEventGalleryImages } from "./public-event-gallery";

const previousBase = process.env.IMAGE_PUBLIC_BASE_URL;

afterEach(() => {
  if (previousBase === undefined) {
    delete process.env.IMAGE_PUBLIC_BASE_URL;
  } else {
    process.env.IMAGE_PUBLIC_BASE_URL = previousBase;
  }
});

function row(imageId: string, sortOrder: number): EventGalleryImageRow {
  return {
    eventId: "event-1",
    imageId,
    sortOrder,
    createdAt: new Date("2026-07-01T12:00:00.000Z"),
  };
}

describe("toPublicEventGalleryImages", () => {
  test("returns empty array for empty input", () => {
    process.env.IMAGE_PUBLIC_BASE_URL = "https://cdn.example.com";
    expect(toPublicEventGalleryImages([])).toEqual([]);
  });

  test("maps thumb and lightbox URLs for each row", () => {
    process.env.IMAGE_PUBLIC_BASE_URL = "https://cdn.example.com";
    const id = "11111111-1111-4111-8111-111111111111";
    const items = toPublicEventGalleryImages([row(id, 0)]);

    expect(items).toHaveLength(1);
    expect(items[0]?.imageId).toBe(id);
    expect(items[0]?.sortOrder).toBe(0);
    expect(items[0]?.thumbSrc).toContain(`/images/${id}/medium-640.jpg`);
    expect(items[0]?.thumbSrcSet).toContain("small-320.jpg");
    expect(items[0]?.fullSrc).toContain(`/images/${id}/large-1280.jpg`);
    expect(items[0]?.fullSrcSet).toContain("medium-640.jpg");
  });

  test("skips rows when public base URL is missing", () => {
    delete process.env.IMAGE_PUBLIC_BASE_URL;
    const items = toPublicEventGalleryImages([row("11111111-1111-4111-8111-111111111111", 0)]);
    expect(items).toEqual([]);
  });
});
