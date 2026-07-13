import { and, eq } from "drizzle-orm";

import { type BookEventResult, bookEvent } from "../booking/book-event";
import { isBookingError } from "../booking/errors";
import type { TxDb } from "../index";
import { type WaitlistEntry, waitlistEntries } from "../schema/waitlist-entries";

import { WaitlistError } from "./errors";

/** Stable booking idempotency key — retries must not double-book. */
export function waitlistPromoteIdempotencyKey(entryId: string): string {
  return `waitlist-promote:${entryId}`;
}

const SKIP_BOOKING_CODES = new Set([
  "INELIGIBLE_SUBSCRIPTION",
  "PAST_DUE",
  "INSUFFICIENT_CREDITS",
  "USER_NOT_FOUND",
]);

export type PromoteOutcome =
  | { kind: "promoted"; entry: WaitlistEntry; booking: BookEventResult }
  | { kind: "skipped"; entry: WaitlistEntry; reason: "INELIGIBLE" }
  | { kind: "capacity"; entry: WaitlistEntry }
  | { kind: "already_promoted"; entry: WaitlistEntry; booking?: BookEventResult };

/**
 * Book-then-mark promotion (no outer transaction around bookEvent):
 * 1. Call bookEvent with waitlist-promote:{entryId}
 * 2. On success, set status PROMOTED (only if still WAITING)
 * 3. On ineligibility, leave WAITING and set skipped_once
 * Never mark PROMOTED before booking succeeds.
 */
export async function promoteWaitlistEntry(db: TxDb, entryId: string): Promise<PromoteOutcome> {
  const entry = await db.query.waitlistEntries.findFirst({
    where: (fields, { eq: eqOp }) => eqOp(fields.id, entryId),
  });

  if (!entry) {
    throw new WaitlistError("NOT_FOUND", "Waitlist entry not found");
  }

  if (entry.status === "PROMOTED") {
    return { kind: "already_promoted", entry };
  }

  if (entry.status !== "WAITING") {
    throw new WaitlistError("NOT_WAITING", "Only WAITING entries can be promoted");
  }

  try {
    const booking = await bookEvent(db, {
      userId: entry.userId,
      eventId: entry.eventId,
      ticketsCount: entry.requestedQty,
      idempotencyKey: waitlistPromoteIdempotencyKey(entry.id),
    });

    const now = new Date();
    const [promoted] = await db
      .update(waitlistEntries)
      .set({
        status: "PROMOTED",
        updatedAt: now,
      })
      .where(and(eq(waitlistEntries.id, entry.id), eq(waitlistEntries.status, "WAITING")))
      .returning();

    return {
      kind: "promoted",
      entry: promoted ?? { ...entry, status: "PROMOTED", updatedAt: now },
      booking,
    };
  } catch (error) {
    if (isBookingError(error)) {
      if (error.code === "SOLD_OUT") {
        return { kind: "capacity", entry };
      }
      if (SKIP_BOOKING_CODES.has(error.code)) {
        const now = new Date();
        const [skipped] = await db
          .update(waitlistEntries)
          .set({
            skippedOnce: true,
            updatedAt: now,
          })
          .where(and(eq(waitlistEntries.id, entry.id), eq(waitlistEntries.status, "WAITING")))
          .returning();

        return {
          kind: "skipped",
          entry: skipped ?? { ...entry, skippedOnce: true, updatedAt: now },
          reason: "INELIGIBLE",
        };
      }
      if (error.code === "EVENT_NOT_FOUND") {
        throw new WaitlistError("EVENT_NOT_FOUND", error.message);
      }
    }
    throw error;
  }
}

export async function readRemainingCapacity(db: TxDb, eventId: string): Promise<number | null> {
  const row = await db.query.events.findFirst({
    where: (fields, { eq: eqOp }) => eqOp(fields.id, eventId),
    columns: { remainingCapacity: true },
  });
  return row?.remainingCapacity ?? null;
}
