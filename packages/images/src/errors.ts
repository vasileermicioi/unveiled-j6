import { ACCEPTED_MIME_TYPES, type AcceptedMimeType } from "./constants";

export class ImageValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImageValidationError";
  }
}

export function validateRemoteContentType(contentType: string | null): AcceptedMimeType {
  const normalized = contentType?.split(";")[0]?.trim().toLowerCase() ?? "";
  if (!ACCEPTED_MIME_TYPES.includes(normalized as AcceptedMimeType)) {
    throw new ImageValidationError("Remote URL must point to a JPEG, PNG, or WebP image");
  }
  return normalized as AcceptedMimeType;
}
