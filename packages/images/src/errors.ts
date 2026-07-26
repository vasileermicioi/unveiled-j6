export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageValidationError";
  }
}

/** Accept any `image/*` content type for the admin remote bytes proxy (incl. SVG). */
export function validateRemoteContentType(contentType: string | null): string {
  const normalized = contentType?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (!normalized.startsWith("image/")) {
    throw new ImageValidationError("Remote URL must point to an image");
  }
  return normalized;
}
