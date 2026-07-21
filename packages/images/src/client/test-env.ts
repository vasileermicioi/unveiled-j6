/**
 * Bun test shim: provide OffscreenCanvas + createImageBitmap via @napi-rs/canvas
 * so the browser client generator can run without a real DOM.
 * Import this module before exercising `generateImageVariantsClient` in tests.
 */
import { Canvas, Image } from "@napi-rs/canvas";

const g = globalThis as Record<string, unknown>;

if (typeof g.OffscreenCanvas === "undefined") {
  g.OffscreenCanvas = Canvas;
}

if (typeof g.Image === "undefined") {
  g.Image = Image;
}

if (typeof g.createImageBitmap !== "function") {
  g.createImageBitmap = async (image: ImageBitmapSource) => {
    const blob = image as Blob;
    const bytes = Buffer.from(await blob.arrayBuffer());
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("createImageBitmap shim failed to decode image"));
      img.src = bytes;
    });

    const canvas = new Canvas(img.width, img.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("createImageBitmap shim: missing 2d context");
    }
    ctx.drawImage(img, 0, 0);

    return Object.assign(canvas, {
      close() {},
    });
  };
}
