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

function drawDrawable(drawable: CanvasImageSource, width: number, height: number): DecodedSource {
  const canvas = createClientCanvas(width, height);
  get2dContext(canvas).drawImage(drawable, 0, 0, width, height);
  return { canvas, width, height };
}

async function loadViaCreateImageBitmap(blob: Blob): Promise<DecodedSource> {
  const bitmap = await createImageBitmap(blob);
  try {
    return drawDrawable(bitmap, bitmap.width, bitmap.height);
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

async function loadViaImageElement(blob: Blob): Promise<DecodedSource> {
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
      return drawDrawable(retry as CanvasImageSource, Number(retry.width), Number(retry.height));
    } finally {
      URL.revokeObjectURL(objectUrl);
    }

    return drawDrawable(img as CanvasImageSource, Number(img.width), Number(img.height));
  }

  await loadImage(img, bytes);
  return drawDrawable(img as CanvasImageSource, Number(img.width), Number(img.height));
}

export async function decodeImageSource(source: File | Blob | ImageBitmap): Promise<DecodedSource> {
  if (isImageBitmapSource(source)) {
    return drawDrawable(source, source.width, source.height);
  }

  if (typeof createImageBitmap === "function") {
    try {
      return await loadViaCreateImageBitmap(source);
    } catch (error) {
      if (error instanceof ImageValidationError) {
        throw error;
      }
    }
  }

  return loadViaImageElement(source);
}
