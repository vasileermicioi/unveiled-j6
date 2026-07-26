import { describe, expect, test } from "bun:test";

import { HERO_MAX_WIDTH } from "../constants";
import { isSvgBlob, resolveRasterSize } from "./decode";

describe("resolveRasterSize", () => {
  test("keeps raster intrinsic size (no upscale)", () => {
    expect(resolveRasterSize(800, 420, false)).toEqual({ width: 800, height: 420 });
    expect(resolveRasterSize(100, 80, false)).toEqual({ width: 100, height: 80 });
  });

  test("upscales SVG to at least hero width", () => {
    expect(resolveRasterSize(100, 80, true)).toEqual({
      width: HERO_MAX_WIDTH,
      height: Math.round((80 * HERO_MAX_WIDTH) / 100),
    });
  });

  test("does not shrink SVG already at or above hero width", () => {
    expect(resolveRasterSize(2400, 1600, true)).toEqual({ width: 2400, height: 1600 });
    expect(resolveRasterSize(HERO_MAX_WIDTH, 1080, true)).toEqual({
      width: HERO_MAX_WIDTH,
      height: 1080,
    });
  });
});

describe("isSvgBlob", () => {
  test("detects MIME and .svg filename", () => {
    expect(isSvgBlob(new Blob(["<svg/>"], { type: "image/svg+xml" }))).toBe(true);
    expect(isSvgBlob(new File(["<svg/>"], "logo.SVG", { type: "application/octet-stream" }))).toBe(
      true,
    );
    expect(isSvgBlob(new Blob([new Uint8Array([0xff, 0xd8])], { type: "image/jpeg" }))).toBe(false);
  });
});
