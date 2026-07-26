import { describe, expect, test } from "bun:test";
import { Image } from "@napi-rs/canvas";

import "./test-env";

import {
  HERO_MAX_WIDTH,
  LARGE_MAX_WIDTH,
  MEDIUM_MAX_WIDTH,
  OG_HEIGHT,
  OG_WIDTH,
  SMALL_MAX_WIDTH,
  VARIANT_FILENAMES,
} from "../constants";
import { ImageValidationError } from "../errors";
import { createSolidJpeg } from "../offline";
import { isWebpBuffer } from "../webp-dimensions";
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
  test("produces five WebP variants with expected resize behavior", async () => {
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
    expect(result.variants).not.toHaveProperty("original.webp");
    expect(result.variants).not.toHaveProperty("original.jpg");

    for (const filename of VARIANT_FILENAMES) {
      const variant = result.variants[filename];
      expect(variant.size).toBeGreaterThan(0);
      expect(variant.type).toBe("image/webp");
      const bytes = new Uint8Array(await variant.arrayBuffer());
      expect(isWebpBuffer(bytes)).toBe(true);
    }

    const hero = await readBlobDimensions(result.variants["hero-1920.webp"]);
    const large = await readBlobDimensions(result.variants["large-1280.webp"]);
    const medium = await readBlobDimensions(result.variants["medium-640.webp"]);
    const small = await readBlobDimensions(result.variants["small-320.webp"]);
    const og = await readBlobDimensions(result.variants["og-1200x630.webp"]);

    expect(hero.width).toBeLessThanOrEqual(HERO_MAX_WIDTH);
    expect(large.width).toBeLessThanOrEqual(LARGE_MAX_WIDTH);
    expect(medium.width).toBeLessThanOrEqual(MEDIUM_MAX_WIDTH);
    expect(small.width).toBeLessThanOrEqual(SMALL_MAX_WIDTH);
    expect(og.width).toBe(OG_WIDTH);
    expect(og.height).toBe(OG_HEIGHT);
  });

  test("does not upscale width-ladder variants for small sources", async () => {
    const sourceWidth = 800;
    const sourceHeight = 420;
    const blob = await blobFromSolidJpeg(sourceWidth, sourceHeight);
    const result = await generateImageVariantsClient(blob);

    const hero = await readBlobDimensions(result.variants["hero-1920.webp"]);
    const small = await readBlobDimensions(result.variants["small-320.webp"]);
    const og = await readBlobDimensions(result.variants["og-1200x630.webp"]);

    expect(hero.width).toBeLessThanOrEqual(sourceWidth);
    expect(small.width).toBeLessThanOrEqual(sourceWidth);
    expect(og.width).toBe(OG_WIDTH);
    expect(og.height).toBe(OG_HEIGHT);
  });

  test("accepts undersized sources without dimension rejection", async () => {
    const blob = await blobFromSolidJpeg(400, 210);
    const result = await generateImageVariantsClient(blob);

    expect(Object.keys(result.variants).sort()).toEqual([...VARIANT_FILENAMES].sort());
    expect(result.metadata.width).toBe(400);
    expect(result.metadata.height).toBe(210);
  });

  test("accepts SVG sources when the runtime can decode them", async () => {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="80">
  <rect width="100" height="80" fill="#f00"/>
</svg>`;
    const blob = new Blob([svg], { type: "image/svg+xml" });

    let result: Awaited<ReturnType<typeof generateImageVariantsClient>> | null = null;
    let caught: unknown;
    try {
      result = await generateImageVariantsClient(blob);
    } catch (error) {
      caught = error;
    }

    if (caught) {
      // Bun/@napi-rs/canvas may not decode SVG; decode failure is acceptable here.
      expect(caught).toBeInstanceOf(ImageValidationError);
      return;
    }

    expect(result).not.toBeNull();
    expect(Object.keys(result?.variants ?? {}).sort()).toEqual([...VARIANT_FILENAMES].sort());
    // SVG is rasterized to ≥ hero width (vector upscale), not the 100px intrinsic size.
    expect(result?.metadata.width).toBe(HERO_MAX_WIDTH);
    expect(result?.metadata.height).toBe(Math.round((80 * HERO_MAX_WIDTH) / 100));
    const hero = await readBlobDimensions(result!.variants["hero-1920.webp"]);
    const large = await readBlobDimensions(result!.variants["large-1280.webp"]);
    expect(hero.width).toBe(HERO_MAX_WIDTH);
    expect(large.width).toBe(LARGE_MAX_WIDTH);
    for (const filename of VARIANT_FILENAMES) {
      expect(result?.variants[filename].type).toBe("image/webp");
    }
  });
});
