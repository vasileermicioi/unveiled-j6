import type { PrebuiltImageVariantsInput } from "@unveiled/images";

import type { CapacityMode, TicketType, TimingMode } from "../schema/events";
import { CatalogValidationError } from "./errors";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type ImageAttachInput = {
  type: "prebuilt";
  input: PrebuiltImageVariantsInput;
  /** Optional remote origin metadata when variants were built from a URL. */
  sourceUrl?: string | null;
};

export type ValidateImageSourceOptions = {
  required?: boolean;
  prebuilt?: PrebuiltImageVariantsInput | null;
};

export function requireNonEmpty(value: string | undefined | null, field: string): string {
  if (!value?.trim()) {
    throw new CatalogValidationError("REQUIRED_FIELD", `${field} is required`);
  }

  return value.trim();
}

export function validateEmail(email: string): string {
  const trimmed = requireNonEmpty(email, "contactEmail");
  if (!EMAIL_PATTERN.test(trimmed)) {
    throw new CatalogValidationError("INVALID_EMAIL", "contactEmail must be a valid email address");
  }

  return trimmed;
}

/**
 * Admin image supply must be a complete prebuilt variant set.
 * Raw buffer upload or URL-alone (server resize) are no longer accepted.
 * A URL may accompany prebuilt variants as sourceUrl metadata only.
 */
export function validateImageSourceExclusive(
  upload?: Buffer | null,
  url?: string | null,
  options?: ValidateImageSourceOptions,
): ImageAttachInput | null {
  const hasPrebuilt = options?.prebuilt != null;
  const hasUpload = upload != null && upload.length > 0;
  const hasUrl = url != null && url.trim().length > 0;

  if (hasPrebuilt && hasUpload) {
    throw new CatalogValidationError(
      "CONFLICTING_IMAGE_SOURCES",
      "Provide either an upload, prebuilt variants, or a remote URL — not more than one",
    );
  }

  if (hasPrebuilt) {
    return {
      type: "prebuilt",
      input: options?.prebuilt as PrebuiltImageVariantsInput,
      sourceUrl: hasUrl ? url?.trim() : null,
    };
  }

  if (hasUpload || hasUrl) {
    throw new CatalogValidationError(
      "CLIENT_IMAGE_REQUIRED",
      "Image variants must be generated in the browser before submit",
    );
  }

  if (options?.required) {
    throw new CatalogValidationError("MISSING_EVENT_IMAGE", "Event image is required");
  }

  return null;
}

export type RedemptionInput = {
  ticketType: TicketType;
  secretCode?: string | null;
  eventWebsiteUrl?: string | null;
};

export function validateRedemptionConfig(input: RedemptionInput): void {
  if (input.ticketType === "SECRET_CODE") {
    if (!input.secretCode?.trim()) {
      throw new CatalogValidationError(
        "INVALID_REDEMPTION_CONFIG",
        "secretCode is required for SECRET_CODE tickets",
      );
    }
    return;
  }

  if (input.ticketType === "VOUCHER_PROMO") {
    if (!input.eventWebsiteUrl?.trim()) {
      throw new CatalogValidationError(
        "INVALID_REDEMPTION_CONFIG",
        "eventWebsiteUrl is required for VOUCHER_PROMO tickets",
      );
    }
    return;
  }

  // VOUCHER_PDF: no event-level promo/code/URL requirement this step.
}

export function applyEventDefaults(input: {
  totalCapacity?: number | null;
  ticketType?: TicketType | null;
  timingMode?: TimingMode | null;
  capacityMode?: CapacityMode | null;
}): {
  totalCapacity: number;
  ticketType: TicketType;
  timingMode: TimingMode;
  capacityMode: CapacityMode;
} {
  return {
    totalCapacity: input.totalCapacity ?? 10,
    ticketType: input.ticketType ?? "SECRET_CODE",
    timingMode: input.timingMode ?? "TIME_SLOT",
    capacityMode: input.capacityMode ?? "SHARED",
  };
}
