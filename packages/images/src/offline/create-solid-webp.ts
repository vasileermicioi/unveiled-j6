import { createCanvas } from "@napi-rs/canvas";

import type { RgbColor } from "./create-solid-jpeg";

/**
 * Bun/test-only solid WebP (via @napi-rs/canvas).
 * Do not import from Workers/server route modules.
 */
export function createSolidWebp(
  width: number,
  height: number,
  color: RgbColor = { r: 120, g: 180, b: 220 },
  quality = 80,
): Buffer {
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = `rgb(${color.r},${color.g},${color.b})`;
  ctx.fillRect(0, 0, width, height);
  return canvas.toBuffer("image/webp", quality);
}
