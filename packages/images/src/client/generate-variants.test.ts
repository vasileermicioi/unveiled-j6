import { describe, expect, test } from "bun:test";
import { Image } from "@napi-rs/canvas";

import "./test-env";

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
  VARIANT_FILENAMES,
} from "../constants";
import { ImageValidationError } from "../errors";
import { createSolidJpeg } from "../offline";
import { generateImageVariantsClient } from "./generate-variants";

async function blobFromSolidJpeg(width: number, height: number): Promise<Blob> {
  const buffer = createSolidJpeg(width, height);
  return new Blob([buffer], { type: "image/jpeg" });
}

async function readBlobDimensions(blob: Blob): Promise<{ width: number; height: number }> {
  const bytes = Buffer.from(await blob.arrayBuffer());
  const img = new Image();
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("Failed to decode variant blob"));
    img.src = bytes;
  });
  return { width: img.width, height: img.height };
}

describe("generateImageVariantsClient", () => {
  test("produces six JPEG variants with expected resize behavior", async () => {
    const sourceWidth = 2400;
    const sourceHeight = 1260;
    const blob = await blobFromSolidJpeg(sourceWidth, sourceHeight);

    const result = await generateImageVariantsClient(blob, { source: "UPLOAD" });

    expect(result.imageId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
    expect(result.metadata.width).toBe(sourceWidth);
    expect(result.metadata.height).toBe(sourceHeight);
    expect(Object.keys(result.variants).sort()).toEqual([...VARIANT_FILENAMES].sort());

    for (const filename of VARIANT_FILENAMES) {
      const variant = result.variants[filename];
      expect(variant.size).toBeGreaterThan(0);
      expect(variant.type).toBe("image/jpeg");
    }

    const original = await readBlobDimensions(result.variants["original.jpg"]);
    const hero = await readBlobDimensions(result.variants["hero-1920.jpg"]);
    const large = await readBlobDimensions(result.variants["large-1280.jpg"]);
    const medium = await readBlobDimensions(result.variants["medium-640.jpg"]);
    const small = await readBlobDimensions(result.variants["small-320.jpg"]);
    const og = await readBlobDimensions(result.variants["og-1200x630.jpg"]);

    expect(original.width).toBeLessThanOrEqual(ORIGINAL_MAX_EDGE);
    expect(original.height).toBeLessThanOrEqual(ORIGINAL_MAX_EDGE);
    expect(hero.width).toBeLessThanOrEqual(HERO_MAX_WIDTH);
    expect(large.width).toBeLessThanOrEqual(LARGE_MAX_WIDTH);
    expect(medium.width).toBeLessThanOrEqual(MEDIUM_MAX_WIDTH);
    expect(small.width).toBeLessThanOrEqual(SMALL_MAX_WIDTH);
    expect(og.width).toBe(OG_WIDTH);
    expect(og.height).toBe(OG_HEIGHT);
  });

  test("does not upscale width-ladder variants for small valid sources", async () => {
    const blob = await blobFromSolidJpeg(MIN_IMAGE_WIDTH, MIN_IMAGE_HEIGHT);
    const result = await generateImageVariantsClient(blob);

    const hero = await readBlobDimensions(result.variants["hero-1920.jpg"]);
    const small = await readBlobDimensions(result.variants["small-320.jpg"]);
    const og = await readBlobDimensions(result.variants["og-1200x630.jpg"]);

    expect(hero.width).toBeLessThanOrEqual(MIN_IMAGE_WIDTH);
    expect(small.width).toBeLessThanOrEqual(MIN_IMAGE_WIDTH);
    expect(og.width).toBe(OG_WIDTH);
    expect(og.height).toBe(OG_HEIGHT);
  });

  test("rejects undersized sources without a partial variants map", async () => {
    const blob = await blobFromSolidJpeg(MIN_IMAGE_WIDTH - 1, MIN_IMAGE_HEIGHT);

    let caught: unknown;
    try {
      await generateImageVariantsClient(blob);
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ImageValidationError);
    expect(caught).not.toHaveProperty("variants");
  });
});
