import { describe, expect, test } from "bun:test";
import sharp from "sharp";

import {
  HERO_MAX_WIDTH,
  LARGE_MAX_WIDTH,
  MEDIUM_MAX_WIDTH,
  MIN_IMAGE_HEIGHT,
  MIN_IMAGE_WIDTH,
  OG_HEIGHT,
  OG_WIDTH,
  ORIGINAL_MAX_EDGE,
  SMALL_MAX_WIDTH,
} from "./constants";
import { generateImageVariants, getVariantDimensions } from "./process";
import { buildVariantUrl } from "./urls";
import { ImageValidationError, validateImageBuffer } from "./validation";

async function createTestImage(width: number, height: number): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 120, g: 180, b: 220 },
    },
  })
    .jpeg()
    .toBuffer();
}

describe("validateImageBuffer", () => {
  test("accepts a valid JPEG at minimum dimensions", async () => {
    const buffer = await createTestImage(MIN_IMAGE_WIDTH, MIN_IMAGE_HEIGHT);
    const result = await validateImageBuffer(buffer);
    expect(result.width).toBe(MIN_IMAGE_WIDTH);
    expect(result.height).toBe(MIN_IMAGE_HEIGHT);
    expect(result.mimeType).toBe("image/jpeg");
  });

  test("rejects undersized images", async () => {
    const buffer = await createTestImage(MIN_IMAGE_WIDTH - 1, MIN_IMAGE_HEIGHT);
    await expect(validateImageBuffer(buffer)).rejects.toBeInstanceOf(ImageValidationError);
  });
});

describe("generateImageVariants", () => {
  test("produces six WebP variants with expected resize behavior", async () => {
    const sourceWidth = 2400;
    const sourceHeight = 1260;
    const buffer = await createTestImage(sourceWidth, sourceHeight);

    const result = await generateImageVariants(buffer, { source: "UPLOAD" });
    const dimensions = await getVariantDimensions(result.variants);

    expect(result.imageId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(result.metadata.width).toBe(sourceWidth);
    expect(result.metadata.height).toBe(sourceHeight);

    expect(dimensions["original.webp"].width).toBeLessThanOrEqual(ORIGINAL_MAX_EDGE);
    expect(dimensions["original.webp"].height).toBeLessThanOrEqual(ORIGINAL_MAX_EDGE);
    expect(dimensions["hero-1920.webp"].width).toBeLessThanOrEqual(HERO_MAX_WIDTH);
    expect(dimensions["large-1280.webp"].width).toBeLessThanOrEqual(LARGE_MAX_WIDTH);
    expect(dimensions["medium-640.webp"].width).toBeLessThanOrEqual(MEDIUM_MAX_WIDTH);
    expect(dimensions["small-320.webp"].width).toBeLessThanOrEqual(SMALL_MAX_WIDTH);
    expect(dimensions["og-1200x630.webp"].width).toBe(OG_WIDTH);
    expect(dimensions["og-1200x630.webp"].height).toBe(OG_HEIGHT);
  });

  test("does not upscale width-ladder variants for small valid sources", async () => {
    const buffer = await createTestImage(MIN_IMAGE_WIDTH, MIN_IMAGE_HEIGHT);
    const result = await generateImageVariants(buffer, { source: "UPLOAD" });
    const dimensions = await getVariantDimensions(result.variants);

    expect(dimensions["hero-1920.webp"].width).toBeLessThanOrEqual(MIN_IMAGE_WIDTH);
    expect(dimensions["small-320.webp"].width).toBeLessThanOrEqual(MIN_IMAGE_WIDTH);
  });
});

describe("buildVariantUrl", () => {
  test("builds public URLs from IMAGE_PUBLIC_BASE_URL", () => {
    const url = buildVariantUrl("11111111-1111-4111-8111-111111111111", "medium-640.webp", {
      IMAGE_PUBLIC_BASE_URL: "https://pub-example.r2.dev/",
    });
    expect(url).toBe(
      "https://pub-example.r2.dev/images/11111111-1111-4111-8111-111111111111/medium-640.webp",
    );
  });
});
