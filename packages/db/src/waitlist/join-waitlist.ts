import { assertValidTicketCount } from "../booking/eligibility";
import { isBookingError } from "../booking/errors";
import type { Db, TxDb } from "../index";
import { type WaitlistEntry, waitlistEntries } from "../schema/waitlist-entries";

import { WaitlistError } from "./errors";

export type WaitlistDb = Db | TxDb;

export type JoinWaitlistInput = {
  userId: string;
  eventId: string;
  requestedQty: number;
};

export type JoinWaitlistResult = {
  entry: WaitlistEntry;
  created: boolean;
};

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const code = "code" in error ? String((error as { code: unknown }).code) : "";
  const message = "message" in error ? String((error as { message: unknown }).message) : "";
  return (
    code === "23505" ||
    message.includes("waitlist_entries_user_event_waiting_uidx") ||
    message.includes("duplicate key")
  );
}

async function findWaitingEntry(
  db: WaitlistDb,
  userId: string,
  eventId: string,
): Promise<WaitlistEntry | undefined> {
  return db.query.waitlistEntries.findFirst({
    where: (fields, { and: andOp, eq: eqOp }) =>
      andOp(
        eqOp(fields.userId, userId),
        eqOp(fields.eventId, eventId),
        eqOp(fields.status, "WAITING"),
      ),
  });
}

/**
 * Create a WAITING waitlist entry, or return the existing one for the same user+event.
 * Auth is the caller's responsibility — domain assumes a trusted userId.
 */
export async function joinWaitlist(
  db: WaitlistDb,
  input: JoinWaitlistInput,
): Promise<JoinWaitlistResult> {
  try {
    assertValidTicketCount(input.requestedQty);
  } catch (error) {
    if (isBookingError(error) && error.code === "INVALID_TICKET_COUNT") {
      throw new WaitlistError("INVALID_QTY", error.message);
    }
    throw error;
  }

  const existing = await findWaitingEntry(db, input.userId, input.eventId);
  if (existing) {
    return { entry: existing, created: false };
  }

  const now = new Date();
  try {
    const [entry] = await db
      .insert(waitlistEntries)
      .values({
        userId: input.userId,
        eventId: input.eventId,
        requestedQty: input.requestedQty,
        status: "WAITING",
        skippedOnce: false,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!entry) {
      throw new WaitlistError("NOT_FOUND", "Failed to create waitlist entry");
    }
    return { entry, created: true };
  } catch (error) {
    if (isUniqueViolation(error)) {
      const raced = await findWaitingEntry(db, input.userId, input.eventId);
      if (raced) {
        return { entry: raced, created: false };
      }
    }
    throw error;
  }
}
