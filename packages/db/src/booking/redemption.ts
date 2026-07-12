import type { Event, SecretCodeMode, TicketType } from "../schema/events";

import { BookingError } from "./errors";

export type RedemptionResult = {
  redemptionType: TicketType;
  redemptionInfo: string;
  redemptionUrl: string | null;
  /** When set, persist onto the event row (SHARED_GENERATED first booking). */
  persistEventSecretCode?: string;
};

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** URL-safe alphanumeric secret (~8 chars). */
export function generateSecretCode(length = 8): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  let out = "";
  for (const byte of bytes) {
    out += CODE_ALPHABET[byte % CODE_ALPHABET.length];
  }
  return out;
}

export function resolveRedemption(event: Event): RedemptionResult {
  if (event.ticketType === "VOUCHER") {
    const promo = event.promoCode?.trim();
    const url = event.eventWebsiteUrl?.trim();
    if (!promo || !url) {
      throw new BookingError(
        "INVALID_REDEMPTION_CONFIG",
        "Voucher events require promoCode and eventWebsiteUrl",
      );
    }
    return {
      redemptionType: "VOUCHER",
      redemptionInfo: promo,
      redemptionUrl: url,
    };
  }

  const mode: SecretCodeMode = event.secretCodeMode ?? "MANUAL";

  if (mode === "MANUAL") {
    const code = event.secretCode?.trim();
    if (!code) {
      throw new BookingError(
        "INVALID_REDEMPTION_CONFIG",
        "Manual secret-code events require a configured secretCode",
      );
    }
    return {
      redemptionType: "SECRET_CODE",
      redemptionInfo: code,
      redemptionUrl: null,
    };
  }

  if (mode === "SHARED_GENERATED") {
    const existing = event.secretCode?.trim();
    if (existing) {
      return {
        redemptionType: "SECRET_CODE",
        redemptionInfo: existing,
        redemptionUrl: null,
      };
    }
    const generated = generateSecretCode();
    return {
      redemptionType: "SECRET_CODE",
      redemptionInfo: generated,
      redemptionUrl: null,
      persistEventSecretCode: generated,
    };
  }

  // UNIQUE_PER_BOOKING
  return {
    redemptionType: "SECRET_CODE",
    redemptionInfo: generateSecretCode(),
    redemptionUrl: null,
  };
}
