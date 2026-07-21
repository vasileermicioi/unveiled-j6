export type ClientCanvas = OffscreenCanvas | HTMLCanvasElement;

export function createClientCanvas(width: number, height: number): ClientCanvas {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }

  if (typeof document !== "undefined") {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
  }

  throw new Error("No canvas implementation available for client image resize");
}

export function get2dContext(
  canvas: ClientCanvas,
): CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Unable to acquire 2D canvas context");
  }
  return ctx as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;
}
