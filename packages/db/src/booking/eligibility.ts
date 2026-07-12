import type { SubscriptionStatus } from "../schema/subscriptions";

import { BookingError } from "./errors";

/** Statuses that may spend credits on bookings (credits-subscription gate table). */
export const BOOKING_ELIGIBLE_STATUSES = ["ACTIVE", "CANCELLED_PENDING"] as const;

export type BookingEligibleStatus = (typeof BOOKING_ELIGIBLE_STATUSES)[number];

export function isBookingEligibleStatus(
  status: SubscriptionStatus | null | undefined,
): status is BookingEligibleStatus {
  return status === "ACTIVE" || status === "CANCELLED_PENDING";
}

/**
 * Throws typed booking errors for non-eligible subscription states.
 * Call after loading the subscription row inside the booking transaction (or on SSR gates).
 */
export function assertBookingEligible(status: SubscriptionStatus | null | undefined): void {
  if (status === "PAST_DUE") {
    throw new BookingError(
      "PAST_DUE",
      "Credits are frozen — update your payment method to book again",
    );
  }

  if (!isBookingEligibleStatus(status)) {
    throw new BookingError(
      "INELIGIBLE_SUBSCRIPTION",
      "An active subscription is required to book events",
    );
  }
}

export function assertValidTicketCount(ticketsCount: number): void {
  if (!Number.isInteger(ticketsCount) || ticketsCount < 1 || ticketsCount > 3) {
    throw new BookingError("INVALID_TICKET_COUNT", "Ticket count must be between 1 and 3");
  }
}
