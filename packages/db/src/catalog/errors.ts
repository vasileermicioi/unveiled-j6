export type CatalogErrorCode =
  | "ALREADY_FEATURED"
  | "CLIENT_IMAGE_REQUIRED"
  | "CONFLICTING_IMAGE_SOURCES"
  | "DUPLICATE_SERIES_SLOTS"
  | "EMPTY_SERIES_SLOTS"
  | "EVENT_NOT_FOUND"
  | "FEATURED_PARTNERS_REORDER_INVALID"
  | "GALLERY_DUPLICATE_IMAGE"
  | "GALLERY_LIMIT_EXCEEDED"
  | "GALLERY_REORDER_INVALID"
  | "INVALID_EMAIL"
  | "INVALID_REDEMPTION_CONFIG"
  | "MISSING_EVENT_IMAGE"
  | "PARTNER_HAS_EVENTS"
  | "PARTNER_NOT_FOUND"
  | "REQUIRED_FIELD";

export class CatalogValidationError extends Error {
  readonly code: CatalogErrorCode;

  constructor(code: CatalogErrorCode, message: string) {
    super(message);
    this.name = "CatalogValidationError";
    this.code = code;
  }
}
