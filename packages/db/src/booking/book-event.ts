import { eq } from "drizzle-orm";
import type { TxDb } from "../index";
import { type Booking, bookings } from "../schema/bookings";
import { creditLedger } from "../schema/credit-ledger";
import { events } from "../schema/events";
import { users } from "../schema/users";

import { assertBookingEligible, assertValidTicketCount } from "./eligibility";
import { BookingError } from "./errors";
import { resolveRedemption } from "./redemption";

export type BookEventInput = {
  userId: string;
  eventId: string;
  ticketsCount: number;
  idempotencyKey: string;
  /** Future admin comps — skips credit deduction and BOOKING ledger write. */
  skipCreditCharge?: boolean;
};

export type BookEventResult = {
  booking: Booking;
  created: boolean;
};

function bookingLedgerKey(userId: string, idempotencyKey: string): string {
  return `booking:${userId}:${idempotencyKey}`;
}

/**
 * Atomic purchase booking: subscription → capacity → credits → redemption → booking + ledger.
 * Only the Booking domain should write purchase bookings / BOOKING ledger rows.
 */
export async function bookEvent(db: TxDb, input: BookEventInput): Promise<BookEventResult> {
  assertValidTicketCount(input.ticketsCount);
  const idempotencyKey = input.idempotencyKey.trim();
  if (!idempotencyKey) {
    throw new BookingError("INVALID_TICKET_COUNT", "idempotencyKey is required");
  }

  return db.transaction(async (tx) => {
    const existing = await tx.query.bookings.findFirst({
      where: (fields, { and, eq: eqOp }) =>
        and(eqOp(fields.userId, input.userId), eqOp(fields.idempotencyKey, idempotencyKey)),
    });
    if (existing) {
      return { booking: existing, created: false };
    }

    const lockedEvents = await tx
      .select()
      .from(events)
      .where(eq(events.id, input.eventId))
      .for("update");
    const event = lockedEvents[0];
    if (!event) {
      throw new BookingError("EVENT_NOT_FOUND", "Event not found");
    }

    const lockedUsers = await tx
      .select()
      .from(users)
      .where(eq(users.id, input.userId))
      .for("update");
    const user = lockedUsers[0];
    if (!user) {
      throw new BookingError("USER_NOT_FOUND", "User not found");
    }

    const subscription = await tx.query.subscriptions.findFirst({
      where: (fields, { eq: eqOp }) => eqOp(fields.userId, input.userId),
    });
    assertBookingEligible(subscription?.status);

    if (event.remainingCapacity < input.ticketsCount) {
      throw new BookingError("SOLD_OUT", "Not enough remaining capacity for this booking");
    }

    const totalCredits = event.creditPrice * input.ticketsCount;
    const skipCharge = Boolean(input.skipCreditCharge);

    if (!skipCharge && user.credits < totalCredits) {
      throw new BookingError("INSUFFICIENT_CREDITS", "Insufficient credits for this booking");
    }

    const redemption = resolveRedemption(event);
    const now = new Date();
    const nextCapacity = event.remainingCapacity - input.ticketsCount;
    const nextCredits = skipCharge ? user.credits : user.credits - totalCredits;

    if (redemption.persistEventSecretCode) {
      await tx
        .update(events)
        .set({
          remainingCapacity: nextCapacity,
          secretCode: redemption.persistEventSecretCode,
          updatedAt: now,
        })
        .where(eq(events.id, event.id));
    } else {
      await tx
        .update(events)
        .set({
          remainingCapacity: nextCapacity,
          updatedAt: now,
        })
        .where(eq(events.id, event.id));
    }

    if (!skipCharge) {
      await tx
        .update(users)
        .set({
          credits: nextCredits,
          updatedAt: now,
        })
        .where(eq(users.id, user.id));
    }

    const [booking] = await tx
      .insert(bookings)
      .values({
        userId: input.userId,
        eventId: event.id,
        partnerId: event.partnerId,
        ticketsCount: input.ticketsCount,
        totalCredits: skipCharge ? 0 : totalCredits,
        status: "CONFIRMED",
        redemptionType: redemption.redemptionType,
        redemptionInfo: redemption.redemptionInfo,
        redemptionUrl: redemption.redemptionUrl,
        idempotencyKey,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!booking) {
      throw new BookingError("EVENT_NOT_FOUND", "Failed to insert booking");
    }

    if (!skipCharge) {
      await tx.insert(creditLedger).values({
        userId: input.userId,
        amount: -totalCredits,
        balanceAfter: nextCredits,
        type: "BOOKING",
        description: `Booking ${event.title} ×${input.ticketsCount}`,
        idempotencyKey: bookingLedgerKey(input.userId, idempotencyKey),
        timestamp: now,
      });
    }

    return { booking, created: true };
  });
}
