import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  HERO_MAX_WIDTH,
  MIN_IMAGE_HEIGHT,
  MIN_IMAGE_WIDTH,
  OG_HEIGHT,
  OG_WIDTH,
  VARIANT_FILENAMES,
  type VariantFilename,
} from "./constants";
import { ImageValidationError } from "./errors";
import { isJpegBuffer, readJpegDimensions } from "./jpeg-dimensions";
import { bufferToPrebuiltVariants, createSolidJpeg } from "./offline";
import { persistPrebuiltImageVariants, validatePrebuiltVariants } from "./prebuilt";

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

describe("validateImageBuffer (magic + dims)", () => {
  test("accepts fixture JPEG at minimum dimensions", async () => {
    const { validateImageBuffer } = await import("./validation");
    const result = await validateImageBuffer(readFixture("solid-800x420.jpg"));
    expect(result.width).toBe(800);
    expect(result.height).toBe(420);
    expect(result.mimeType).toBe("image/jpeg");
  });

  test("rejects undersized JPEG", async () => {
    const { validateImageBuffer } = await import("./validation");
    await expect(validateImageBuffer(readFixture("solid-799x420.jpg"))).rejects.toBeInstanceOf(
      ImageValidationError,
    );
  });
});

describe("validatePrebuiltVariants / persistPrebuiltImageVariants", () => {
  test("accepts a valid six-variant set with skipUpload", async () => {
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

  test("rejects a missing variant", async () => {
    const generated = await buildValidPrebuiltVariants();
    const variants = { ...generated.variants };
    delete (variants as Partial<Record<VariantFilename, Buffer>>)["small-320.jpg"];

    expect(() =>
      validatePrebuiltVariants({
        imageId: generated.imageId,
        variants: variants as Record<VariantFilename, Buffer>,
      }),
    ).toThrow(ImageValidationError);
  });

  test("rejects a non-JPEG variant", async () => {
    const generated = await buildValidPrebuiltVariants();
    const variants = {
      ...generated.variants,
      "medium-640.jpg": Buffer.from("definitely-not-jpeg-bytes"),
    };

    expect(() =>
      validatePrebuiltVariants({
        imageId: generated.imageId,
        variants,
      }),
    ).toThrow(/must be a JPEG/i);
  });

  test("rejects wrong OG dimensions", async () => {
    const generated = await buildValidPrebuiltVariants();
    const wrongOg = createSolidJpeg(MIN_IMAGE_WIDTH, MIN_IMAGE_HEIGHT);
    const variants = {
      ...generated.variants,
      "og-1200x630.jpg": wrongOg,
    };

    expect(() =>
      validatePrebuiltVariants({
        imageId: generated.imageId,
        variants,
      }),
    ).toThrow(new RegExp(`${OG_WIDTH}x${OG_HEIGHT}`));
  });

  test("rejects a ladder variant wider than its cap", async () => {
    const generated = await buildValidPrebuiltVariants();
    const oversizedHero = createSolidJpeg(HERO_MAX_WIDTH + 40, 600);
    const variants = {
      ...generated.variants,
      "hero-1920.jpg": oversizedHero,
    };

    expect(() =>
      validatePrebuiltVariants({
        imageId: generated.imageId,
        variants,
      }),
    ).toThrow(/exceeds max/i);
  });

  test("rejects a ladder variant larger than original.jpg", async () => {
    const original = createSolidJpeg(MIN_IMAGE_WIDTH, MIN_IMAGE_HEIGHT);
    const tallerMedium = createSolidJpeg(640, MIN_IMAGE_HEIGHT + 80);
    const og = createSolidJpeg(OG_WIDTH, OG_HEIGHT);
    const variants = {
      "original.jpg": original,
      "hero-1920.jpg": original,
      "large-1280.jpg": original,
      "medium-640.jpg": tallerMedium,
      "small-320.jpg": createSolidJpeg(320, 168),
      "og-1200x630.jpg": og,
    };

    expect(() =>
      validatePrebuiltVariants({
        imageId: FIXTURE_IMAGE_ID,
        variants,
      }),
    ).toThrow(/must not be larger than original/i);
  });
});
