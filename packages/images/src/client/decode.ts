import { HERO_MAX_WIDTH } from "../constants";
import { ImageValidationError } from "../errors";
import { type ClientCanvas, createClientCanvas, get2dContext } from "./canvas";

export type DecodedSource = {
  canvas: ClientCanvas;
  width: number;
  height: number;
};

function isImageBitmapSource(value: unknown): value is ImageBitmap {
  return typeof ImageBitmap !== "undefined" && value instanceof ImageBitmap;
}

/** SVG (and XML-wrapped SVG) — vectors can be rasterized crisply at any pixel size. */
export function isSvgBlob(blob: Blob): boolean {
  const type = blob.type.toLowerCase();
  if (type === "image/svg+xml" || type.includes("svg")) {
    return true;
  }
  if (blob instanceof File && /\.svg$/i.test(blob.name)) {
    return true;
  }
  return false;
}

/**
 * Pixel size for the decoded canvas.
 * Raster bitmaps keep intrinsic size (ladder never upscales).
 * SVG is rasterized to at least hero width so vector detail fills the ladder.
 */
export function resolveRasterSize(
  intrinsicWidth: number,
  intrinsicHeight: number,
  vectorSource: boolean,
): { width: number; height: number } {
  const width = Math.max(1, Math.round(intrinsicWidth));
  const height = Math.max(1, Math.round(intrinsicHeight));
  if (!vectorSource || width >= HERO_MAX_WIDTH) {
    return { width, height };
  }
  const targetWidth = HERO_MAX_WIDTH;
  const targetHeight = Math.max(1, Math.round((height * targetWidth) / width));
  return { width: targetWidth, height: targetHeight };
}

function drawDrawable(drawable: CanvasImageSource, width: number, height: number): DecodedSource {
  const canvas = createClientCanvas(width, height);
  get2dContext(canvas).drawImage(drawable, 0, 0, width, height);
  return { canvas, width, height };
}

async function loadViaCreateImageBitmap(blob: Blob, vectorSource: boolean): Promise<DecodedSource> {
  const bitmap = await createImageBitmap(blob);
  try {
    const size = resolveRasterSize(bitmap.width, bitmap.height, vectorSource);
    return drawDrawable(bitmap, size.width, size.height);
  } finally {
    bitmap.close();
  }
}

function loadImage(img: HTMLImageElement, src: string | Uint8Array): Promise<void> {
  return new Promise((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () =>
      reject(new ImageValidationError("Unable to read image dimensions or format"));
    img.src = src as string;
  });
}

async function loadViaImageElement(blob: Blob, vectorSource: boolean): Promise<DecodedSource> {
  const ImgCtor = globalThis.Image;
  if (typeof ImgCtor !== "function") {
    throw new ImageValidationError("Unable to read image dimensions or format");
  }

  const bytes = new Uint8Array(await blob.arrayBuffer());
  const img = new ImgCtor();

  if (typeof URL !== "undefined" && typeof URL.createObjectURL === "function") {
    const objectUrl = URL.createObjectURL(blob);
    try {
      await loadImage(img, objectUrl);
    } catch {
      // Bun + @napi-rs/canvas Image does not load blob: URLs — try raw bytes next.
      const retry = new ImgCtor();
      await loadImage(retry, bytes);
      const size = resolveRasterSize(Number(retry.width), Number(retry.height), vectorSource);
      return drawDrawable(retry as CanvasImageSource, size.width, size.height);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }

    const size = resolveRasterSize(Number(img.width), Number(img.height), vectorSource);
    return drawDrawable(img as CanvasImageSource, size.width, size.height);
  }

  await loadImage(img, bytes);
  const size = resolveRasterSize(Number(img.width), Number(img.height), vectorSource);
  return drawDrawable(img as CanvasImageSource, size.width, size.height);
}

export async function decodeImageSource(source: File | Blob | ImageBitmap): Promise<DecodedSource> {
  if (isImageBitmapSource(source)) {
    // ImageBitmap has already been rasterized at a fixed size — keep as-is.
    return drawDrawable(source, source.width, source.height);
  }

  const vectorSource = isSvgBlob(source);

  if (typeof createImageBitmap === "function") {
    try {
      return await loadViaCreateImageBitmap(source, vectorSource);
    } catch (error) {
      if (error instanceof ImageValidationError) {
        throw error;
      }
    }
  }

  return loadViaImageElement(source, vectorSource);
}
