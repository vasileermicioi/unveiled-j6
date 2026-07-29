import type { Event, TicketType } from "../schema/events";

import { BookingError } from "./errors";

export type RedemptionResult = {
  redemptionType: TicketType;
  redemptionInfo: string | null;
  redemptionUrl: string | null;
};

/** Shared-secret path only — voucher types use inventory allocation. */
export function resolveRedemption(event: Event): RedemptionResult {
  if (event.ticketType !== "SECRET_CODE") {
    throw new BookingError(
      "INVALID_REDEMPTION_CONFIG",
      "Voucher events require inventory allocation; use allocateRedemptionTickets",
    );
  }

  const code = event.secretCode?.trim();
  if (!code) {
    throw new BookingError(
      "INVALID_REDEMPTION_CONFIG",
      "Secret-code events require a configured secretCode",
    );
  }

  return {
    redemptionType: "SECRET_CODE",
    redemptionInfo: code,
    redemptionUrl: null,
  };
}
