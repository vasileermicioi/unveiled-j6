import { collect, encodeJpeg, type PixelStream, type Scanline } from "@standardagents/sip";

import { sipReady } from "./sip-ready";

export type RgbColor = { r: number; g: number; b: number };

/**
 * Synthesize a solid-color JPEG using sip (no Node-native image addons).
 * Used by package tests and catalog seed/fixture helpers.
 */
export async function createSolidJpeg(
  width: number,
  height: number,
  color: RgbColor = { r: 120, g: 180, b: 220 },
): Promise<Buffer> {
  await sipReady;

  const row = new Uint8Array(width * 3);
  for (let x = 0; x < width; x++) {
    row[x * 3] = color.r;
    row[x * 3 + 1] = color.g;
    row[x * 3 + 2] = color.b;
  }

  const stream: PixelStream = {
    info: Promise.resolve({
      width,
      height,
      originalFormat: "jpeg",
    }),
    [Symbol.asyncIterator]() {
      return (async function* (): AsyncGenerator<Scanline> {
        for (let y = 0; y < height; y++) {
          yield { data: row, width, y };
        }
      })();
    },
  };

  const { data } = await collect(encodeJpeg(stream, { quality: 90 }));
  return Buffer.from(data);
}
