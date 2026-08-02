export type CatalogErrorCode =
  | "ALREADY_FEATURED"
  | "CLIENT_IMAGE_REQUIRED"
  | "CONFLICTING_IMAGE_SOURCES"
  | "DUPLICATE_SERIES_SLOTS"
  | "DUPLICATE_VOUCHER_CODE"
  | "EMPTY_SERIES_SLOTS"
  | "EMPTY_VOUCHER_INVENTORY"
  | "EVENT_NOT_FOUND"
  | "FEATURED_PARTNERS_REORDER_INVALID"
  | "GALLERY_DUPLICATE_IMAGE"
  | "GALLERY_REORDER_INVALID"
  | "IMAGE_NOT_FOUND"
  | "INVALID_EMAIL"
  | "INVALID_REDEMPTION_CONFIG"
  | "INVALID_SUBTITLE_LANGUAGE"
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
