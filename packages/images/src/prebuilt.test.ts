import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  HERO_MAX_WIDTH,
  OG_HEIGHT,
  OG_WIDTH,
  VARIANT_FILENAMES,
  type VariantFilename,
} from "./constants";
import { ImageValidationError } from "./errors";
import { isJpegBuffer, readJpegDimensions } from "./jpeg-dimensions";
import { bufferToPrebuiltVariants, createSolidWebp } from "./offline";
import { persistPrebuiltImageVariants, validatePrebuiltVariants } from "./prebuilt";
import { isWebpBuffer, readWebpDimensions } from "./webp-dimensions";

const FIXTURE_IMAGE_ID = "22222222-2222-4222-8222-222222222222";
const FIXTURES_DIR = join(import.meta.dir, "../test/fixtures");

function readFixture(name: string): Buffer {
  return readFileSync(join(FIXTURES_DIR, name));
}

async function buildValidPrebuiltVariants() {
  const source = readFixture("solid-1600x840.jpg");
  return bufferToPrebuiltVariants(source, {
    source: "UPLOAD",
    imageId: FIXTURE_IMAGE_ID,
  });
}

describe("jpeg-dimensions", () => {
  test("detects JPEG magic and reads SOF dimensions", () => {
    const buffer = readFixture("solid-800x420.jpg");
    expect(isJpegBuffer(buffer)).toBe(true);
    expect(readJpegDimensions(buffer)).toEqual({ width: 800, height: 420 });
  });

  test("rejects non-JPEG buffers", () => {
    const buffer = Buffer.from("not-a-jpeg");
    expect(isJpegBuffer(buffer)).toBe(false);
    expect(readJpegDimensions(buffer)).toBeNull();
  });
});

describe("webp-dimensions", () => {
  test("detects WebP magic and reads dimensions", () => {
    const buffer = createSolidWebp(320, 168);
    expect(isWebpBuffer(buffer)).toBe(true);
    expect(readWebpDimensions(buffer)).toEqual({ width: 320, height: 168 });
  });
});

describe("validateImageBuffer (magic + dims)", () => {
  test("accepts fixture JPEG without min-dimension gate", async () => {
    const { validateImageBuffer } = await import("./validation");
    const result = await validateImageBuffer(readFixture("solid-799x420.jpg"));
    expect(result.width).toBe(799);
    expect(result.height).toBe(420);
    expect(result.mimeType).toBe("image/jpeg");
  });

  test("accepts fixture JPEG at former minimum dimensions", async () => {
    const { validateImageBuffer } = await import("./validation");
    const result = await validateImageBuffer(readFixture("solid-800x420.jpg"));
    expect(result.width).toBe(800);
    expect(result.height).toBe(420);
    expect(result.mimeType).toBe("image/jpeg");
  });
});

describe("validatePrebuiltVariants / persistPrebuiltImageVariants", () => {
  test("accepts a valid five-variant WebP set with skipUpload", async () => {
    const generated = await buildValidPrebuiltVariants();
    const result = await persistPrebuiltImageVariants(
      {
        imageId: generated.imageId,
        variants: generated.variants,
        claimedWidth: generated.claimedWidth,
        claimedHeight: generated.claimedHeight,
      },
      { skipUpload: true },
    );

    expect(result.imageId).toBe(FIXTURE_IMAGE_ID);
    expect(result.metadata.width).toBe(1600);
    expect(result.metadata.height).toBe(840);
    expect(result.metadata.source).toBe("UPLOAD");
    expect(Object.keys(result.variants).sort()).toEqual([...VARIANT_FILENAMES].sort());
  });

  test("rejects missing claimed dimensions", async () => {
    const generated = await buildValidPrebuiltVariants();

    expect(() =>
      validatePrebuiltVariants({
        imageId: generated.imageId,
        variants: generated.variants,
      }),
    ).toThrow(/claimedWidth and claimedHeight/i);
  });

  test("rejects a missing variant", async () => {
    const generated = await buildValidPrebuiltVariants();
    const variants = { ...generated.variants };
    delete (variants as Partial<Record<VariantFilename, Buffer>>)["small-320.webp"];

    expect(() =>
      validatePrebuiltVariants({
        imageId: generated.imageId,
        variants: variants as Record<VariantFilename, Buffer>,
        claimedWidth: generated.claimedWidth,
        claimedHeight: generated.claimedHeight,
      }),
    ).toThrow(ImageValidationError);
  });

  test("rejects a non-WebP variant", async () => {
    const generated = await buildValidPrebuiltVariants();
    const variants = {
      ...generated.variants,
      "medium-640.webp": Buffer.from("definitely-not-webp-bytes"),
    };

    expect(() =>
      validatePrebuiltVariants({
        imageId: generated.imageId,
        variants,
        claimedWidth: generated.claimedWidth,
        claimedHeight: generated.claimedHeight,
      }),
    ).toThrow(/must be a WebP/i);
  });

  test("rejects wrong OG dimensions", async () => {
    const generated = await buildValidPrebuiltVariants();
    const wrongOg = createSolidWebp(800, 420);
    const variants = {
      ...generated.variants,
      "og-1200x630.webp": wrongOg,
    };

    expect(() =>
      validatePrebuiltVariants({
        imageId: generated.imageId,
        variants,
        claimedWidth: generated.claimedWidth,
        claimedHeight: generated.claimedHeight,
      }),
    ).toThrow(new RegExp(`${OG_WIDTH}x${OG_HEIGHT}`));
  });

  test("rejects a ladder variant wider than its cap", async () => {
    const generated = await buildValidPrebuiltVariants();
    const oversizedHero = createSolidWebp(HERO_MAX_WIDTH + 40, 600);
    const variants = {
      ...generated.variants,
      "hero-1920.webp": oversizedHero,
    };

    expect(() =>
      validatePrebuiltVariants({
        imageId: generated.imageId,
        variants,
        claimedWidth: Math.max(generated.claimedWidth ?? 0, HERO_MAX_WIDTH + 40),
        claimedHeight: Math.max(generated.claimedHeight ?? 0, 600),
      }),
    ).toThrow(/exceeds max/i);
  });

  test("rejects a ladder variant larger than claimed source", async () => {
    const hero = createSolidWebp(800, 420);
    const tallerMedium = createSolidWebp(640, 500);
    const og = createSolidWebp(OG_WIDTH, OG_HEIGHT);
    const variants = {
      "hero-1920.webp": hero,
      "large-1280.webp": hero,
      "medium-640.webp": tallerMedium,
      "small-320.webp": createSolidWebp(320, 168),
      "og-1200x630.webp": og,
    };

    expect(() =>
      validatePrebuiltVariants({
        imageId: FIXTURE_IMAGE_ID,
        variants,
        claimedWidth: 800,
        claimedHeight: 420,
      }),
    ).toThrow(/must not be larger than the claimed source/i);
  });
});
