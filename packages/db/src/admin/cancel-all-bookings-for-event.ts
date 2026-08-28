import { and, asc, count, eq, inArray } from "drizzle-orm";

import { restockBookingInventory } from "../booking/allocate-redemption-tickets";
import type { TxDb } from "../index";
import { bookings } from "../schema/bookings";
import { creditLedger } from "../schema/credit-ledger";
import { events } from "../schema/events";
import { type UserProfile, users } from "../schema/users";
import { waitlistEntries } from "../schema/waitlist-entries";

import { AdminCapacityError } from "./errors";

export type CancelAllBookingsForEventInput = {
  eventId: string;
  reason: string;
  /** Trusted admin actor id for call-site audit; not persisted (no cancelled_by column). */
  adminUserId: string;
};

export type CancelAllNotificationLocale = "de" | "en";

export type CancelledMemberNotification = {
  bookingId: string;
  userId: string;
  email: string;
  locale: CancelAllNotificationLocale;
  totalCredits: number;
  ticketsCount: number;
  dateTime: Date;
};

export type ClosedWaitlistNotification = {
  userId: string;
  email: string;
  locale: CancelAllNotificationLocale;
};

export type CancelAllBookingsForEventResult = {
  cancelled: number;
  refundedCredits: number;
  waitlistCancelled: number;
  skippedUsed: number;
  cancelledMembers: CancelledMemberNotification[];
  closedWaitlistMembers: ClosedWaitlistNotification[];
};

function notificationLocale(profile: UserProfile | null | undefined): CancelAllNotificationLocale {
  return profile?.language === "EN" ? "en" : "de";
}

type NotifyUser = {
  email: string;
  locale: CancelAllNotificationLocale;
};

/**
 * Cancel every CONFIRMED booking for an event in one transaction: restock inventory,
 * refund charged credits, restore capacity by cancelled ticket counts, and close
 * WAITING waitlist entries. Does not run waitlist promotion.
 */
export async function cancelAllBookingsForEvent(
  db: TxDb,
  input: CancelAllBookingsForEventInput,
): Promise<CancelAllBookingsForEventResult> {
  void input.adminUserId;

  const reason = input.reason.trim();
  if (!reason) {
    throw new AdminCapacityError("INVALID_REASON", "Cancellation reason is required");
  }

  return db.transaction(async (tx) => {
    const lockedEvents = await tx
      .select()
      .from(events)
      .where(eq(events.id, input.eventId))
      .for("update");
    const event = lockedEvents[0];
    if (!event) {
      throw new AdminCapacityError("EVENT_NOT_FOUND", "Event not found");
    }

    const [usedRow] = await tx
      .select({ value: count() })
      .from(bookings)
      .where(and(eq(bookings.eventId, input.eventId), eq(bookings.status, "USED")));
    const skippedUsed = usedRow?.value ?? 0;

    const confirmed = await tx
      .select()
      .from(bookings)
      .where(and(eq(bookings.eventId, input.eventId), eq(bookings.status, "CONFIRMED")))
      .orderBy(asc(bookings.id))
      .for("update");

    const userIds = [...new Set(confirmed.map((booking) => booking.userId))].sort();
    const creditsByUser = new Map<string, number>();
    const usersById = new Map<string, NotifyUser>();
    if (userIds.length > 0) {
      const lockedUsers = await tx
        .select()
        .from(users)
        .where(inArray(users.id, userIds))
        .orderBy(asc(users.id))
        .for("update");
      for (const user of lockedUsers) {
        creditsByUser.set(user.id, user.credits);
        usersById.set(user.id, {
          email: user.email,
          locale: notificationLocale(user.profile),
        });
      }
    }

    const now = new Date();
    let refundedCredits = 0;

    for (const booking of confirmed) {
      await restockBookingInventory(tx, booking.id);

      await tx
        .update(bookings)
        .set({
          status: "CANCELLED",
          cancellationReason: reason,
          cancelledAt: now,
          updatedAt: now,
        })
        .where(eq(bookings.id, booking.id));

      if (booking.totalCredits <= 0) {
        continue;
      }

      const current = creditsByUser.get(booking.userId);
      if (current === undefined) {
        throw new AdminCapacityError("BOOKING_NOT_FOUND", "Member not found for booking");
      }
      const nextCredits = current + booking.totalCredits;
      creditsByUser.set(booking.userId, nextCredits);

      await tx
        .update(users)
        .set({ credits: nextCredits, updatedAt: now })
        .where(eq(users.id, booking.userId));

      await tx.insert(creditLedger).values({
        userId: booking.userId,
        amount: booking.totalCredits,
        balanceAfter: nextCredits,
        type: "REFUND",
        description: "Event cancel-all",
        idempotencyKey: `event-cancel-all:${booking.id}`,
        timestamp: now,
      });

      refundedCredits += booking.totalCredits;
    }

    const ticketsRestored = confirmed.reduce((sum, booking) => sum + booking.ticketsCount, 0);
    if (ticketsRestored > 0) {
      await tx
        .update(events)
        .set({
          remainingCapacity: event.remainingCapacity + ticketsRestored,
          updatedAt: now,
        })
        .where(eq(events.id, event.id));
    }

    const closedWaitlist = await tx
      .update(waitlistEntries)
      .set({
        status: "CANCELLED",
        updatedAt: now,
      })
      .where(and(eq(waitlistEntries.eventId, input.eventId), eq(waitlistEntries.status, "WAITING")))
      .returning({ userId: waitlistEntries.userId });

    const waitlistUserIds = [...new Set(closedWaitlist.map((row) => row.userId))].sort();
    const missingWaitlistUserIds = waitlistUserIds.filter((userId) => !usersById.has(userId));
    if (missingWaitlistUserIds.length > 0) {
      const waitlistUsers = await tx
        .select()
        .from(users)
        .where(inArray(users.id, missingWaitlistUserIds));
      for (const user of waitlistUsers) {
        usersById.set(user.id, {
          email: user.email,
          locale: notificationLocale(user.profile),
        });
      }
    }

    const cancelledMembers: CancelledMemberNotification[] = confirmed.map((booking) => {
      const info = usersById.get(booking.userId);
      return {
        bookingId: booking.id,
        userId: booking.userId,
        email: info?.email ?? "",
        locale: info?.locale ?? "de",
        totalCredits: booking.totalCredits,
        ticketsCount: booking.ticketsCount,
        dateTime: booking.dateTime,
      };
    });

    const closedWaitlistMembers: ClosedWaitlistNotification[] = waitlistUserIds.map((userId) => {
      const info = usersById.get(userId);
      return {
        userId,
        email: info?.email ?? "",
        locale: info?.locale ?? "de",
      };
    });

    return {
      cancelled: confirmed.length,
      refundedCredits,
      waitlistCancelled: closedWaitlist.length,
      skippedUsed,
      cancelledMembers,
      closedWaitlistMembers,
    };
  });
}
