import { eq } from "drizzle-orm";
import {
  creditPriceForOccurrence,
  futureOccurrences,
  primaryDateTimeFromList,
} from "../catalog/datetime";
import type { TxDb } from "../index";
import { type Booking, bookings } from "../schema/bookings";
import { creditLedger } from "../schema/credit-ledger";
import { type Event, events } from "../schema/events";
import { users } from "../schema/users";

import { lockRedemptionAllocation, writeRedemptionTickets } from "./allocate-redemption-tickets";
import { assertBookingEligible, assertValidTicketCount } from "./eligibility";
import { BookingError } from "./errors";

export type BookEventInput = {
  userId: string;
  eventId: string;
  ticketsCount: number;
  idempotencyKey: string;
  /** Chosen occurrence instant. Omit for waitlist promotion / admin comps. */
  dateTime?: Date;
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

function canonicalOccurrenceInstant(event: Event, dateTime: Date): Date | undefined {
  const targetMs = dateTime.getTime();
  return event.dateTimes.find((value) => value.getTime() === targetMs);
}

/**
 * Member purchase: posted instant must match a future occurrence.
 * Waitlist/comp omit `dateTime` → next upcoming, else primary when all past.
 */
function resolveBookingSlot(event: Event, posted: Date | undefined, now: Date): Date {
  if (posted !== undefined) {
    const canonical = canonicalOccurrenceInstant(event, posted);
    if (!canonical) {
      throw new BookingError("UNKNOWN_SLOT", "Datetime is not an occurrence of this event");
    }
    if (canonical.getTime() < now.getTime()) {
      throw new BookingError("PAST_SLOT", "Datetime is in the past");
    }
    return canonical;
  }

  const next = futureOccurrences(event.dateTimes, event.occurrenceCreditPrices, now)[0];
  if (next) {
    return next.startsAt;
  }
  return primaryDateTimeFromList(event.dateTimes, now);
}

/**
 * Atomic purchase booking: subscription → capacity → credits → redemption allocation → booking + ledger.
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

    const now = new Date();
    const slotDateTime = resolveBookingSlot(event, input.dateTime, now);
    const slotPrice = creditPriceForOccurrence(
      event.dateTimes,
      event.occurrenceCreditPrices,
      slotDateTime,
    );
    if (slotPrice === null) {
      throw new BookingError("UNKNOWN_SLOT", "Datetime is not an occurrence of this event");
    }

    const totalCredits = slotPrice * input.ticketsCount;
    const skipCharge = Boolean(input.skipCreditCharge);

    if (!skipCharge && user.credits < totalCredits) {
      throw new BookingError("INSUFFICIENT_CREDITS", "Insufficient credits for this booking");
    }

    const allocation = await lockRedemptionAllocation(tx, event, input.ticketsCount);
    const nextCapacity = event.remainingCapacity - input.ticketsCount;
    const nextCredits = skipCharge ? user.credits : user.credits - totalCredits;

    await tx
      .update(events)
      .set({
        remainingCapacity: nextCapacity,
        updatedAt: now,
      })
      .where(eq(events.id, event.id));

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
        dateTime: slotDateTime,
        status: "CONFIRMED",
        redemptionType: allocation.summary.redemptionType,
        redemptionInfo: allocation.summary.redemptionInfo,
        redemptionUrl: allocation.summary.redemptionUrl,
        idempotencyKey,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!booking) {
      throw new BookingError("EVENT_NOT_FOUND", "Failed to insert booking");
    }

    await writeRedemptionTickets(tx, {
      bookingId: booking.id,
      event,
      ticketsCount: input.ticketsCount,
      allocation,
    });

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
