import type { PrebuiltImageVariantsInput } from "@unveiled/images";

import type { SecretCodeMode, TicketType, TimingMode } from "../schema/events";
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
  secretCodeMode?: SecretCodeMode | null;
  secretCode?: string | null;
  promoCode?: string | null;
  eventWebsiteUrl?: string | null;
};

export function validateRedemptionConfig(input: RedemptionInput): void {
  if (input.ticketType === "SECRET_CODE") {
    const mode = input.secretCodeMode ?? "MANUAL";
    if (mode === "MANUAL" && !input.secretCode?.trim()) {
      throw new CatalogValidationError(
        "INVALID_REDEMPTION_CONFIG",
        "secretCode is required for SECRET_CODE tickets with MANUAL mode",
      );
    }
    return;
  }

  if (!input.promoCode?.trim() || !input.eventWebsiteUrl?.trim()) {
    throw new CatalogValidationError(
      "INVALID_REDEMPTION_CONFIG",
      "promoCode and eventWebsiteUrl are required for VOUCHER tickets",
    );
  }
}

export function validateUniqueSeriesSlots(slots: Date[]): Date[] {
  if (slots.length === 0) {
    throw new CatalogValidationError(
      "EMPTY_SERIES_SLOTS",
      "At least one date/time slot is required",
    );
  }

  const seen = new Set<string>();
  const unique: Date[] = [];

  for (const slot of slots) {
    const key = slot.toISOString();
    if (seen.has(key)) {
      throw new CatalogValidationError("DUPLICATE_SERIES_SLOTS", "Series slots must be unique");
    }
    seen.add(key);
    unique.push(slot);
  }

  return unique;
}

export function applyEventDefaults(input: {
  totalCapacity?: number | null;
  ticketType?: TicketType | null;
  secretCodeMode?: SecretCodeMode | null;
  timingMode?: TimingMode | null;
}): {
  totalCapacity: number;
  ticketType: TicketType;
  secretCodeMode: SecretCodeMode;
  timingMode: TimingMode;
} {
  return {
    totalCapacity: input.totalCapacity ?? 10,
    ticketType: input.ticketType ?? "SECRET_CODE",
    secretCodeMode: input.secretCodeMode ?? "MANUAL",
    timingMode: input.timingMode ?? "TIME_SLOT",
  };
}
