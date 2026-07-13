import { eq } from "drizzle-orm";

import type { TxDb } from "../index";
import { type Booking, bookings } from "../schema/bookings";
import { events } from "../schema/events";
import {
  type ProcessWaitlistResult,
  processWaitlistForEvent,
} from "../waitlist/process-waitlist-for-event";

import { AdminCapacityError } from "./errors";

export type CancelBookingAsAdminInput = {
  bookingId: string;
  reason: string;
  /** Trusted admin actor id for call-site audit; not persisted (no cancelled_by column). */
  adminUserId: string;
};

export type CancelBookingAsAdminResult = {
  booking: Booking;
  waitlist: ProcessWaitlistResult;
};

/**
 * Admin cancel of a CONFIRMED booking: restore capacity, no credit refund,
 * then run waitlist processing for the event.
 */
export async function cancelBookingAsAdmin(
  db: TxDb,
  input: CancelBookingAsAdminInput,
): Promise<CancelBookingAsAdminResult> {
  void input.adminUserId;

  const reason = input.reason.trim();
  if (!reason) {
    throw new AdminCapacityError("INVALID_REASON", "Cancellation reason is required");
  }

  const cancelled = await db.transaction(async (tx) => {
    const lockedBookings = await tx
      .select()
      .from(bookings)
      .where(eq(bookings.id, input.bookingId))
      .for("update");
    const booking = lockedBookings[0];
    if (!booking) {
      throw new AdminCapacityError("BOOKING_NOT_FOUND", "Booking not found");
    }
    if (booking.status !== "CONFIRMED") {
      throw new AdminCapacityError(
        "NOT_CONFIRMED",
        "Only CONFIRMED bookings can be cancelled by admin",
      );
    }

    const lockedEvents = await tx
      .select()
      .from(events)
      .where(eq(events.id, booking.eventId))
      .for("update");
    const event = lockedEvents[0];
    if (!event) {
      throw new AdminCapacityError("EVENT_NOT_FOUND", "Event not found for booking");
    }

    const now = new Date();
    const [updated] = await tx
      .update(bookings)
      .set({
        status: "CANCELLED",
        cancellationReason: reason,
        cancelledAt: now,
        updatedAt: now,
      })
      .where(eq(bookings.id, booking.id))
      .returning();

    if (!updated) {
      throw new AdminCapacityError("BOOKING_NOT_FOUND", "Failed to cancel booking");
    }

    await tx
      .update(events)
      .set({
        remainingCapacity: event.remainingCapacity + booking.ticketsCount,
        updatedAt: now,
      })
      .where(eq(events.id, event.id));

    return updated;
  });

  const waitlist = await processWaitlistForEvent(db, cancelled.eventId);
  return { booking: cancelled, waitlist };
}
