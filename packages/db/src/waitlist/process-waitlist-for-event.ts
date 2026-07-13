/**
 * Waitlist promotion processor — book-then-mark strategy.
 *
 * `bookEvent` always opens its own transaction, so we do NOT wrap it in an outer
 * waitlist transaction. For each candidate:
 *   1. Call bookEvent(idempotencyKey = waitlist-promote:{entryId})
 *   2. On success → mark PROMOTED
 *   3. On ineligibility → leave WAITING, set skipped_once, continue
 *   4. On SOLD_OUT → stop (capacity exhausted)
 *
 * Never mark PROMOTED before booking succeeds. Retries are safe via the idempotency key.
 *
 * Queue: WAITING entries ordered by created_at ASC. Entries whose requestedQty does not
 * fit remaining capacity are left WAITING without skipped_once; later smaller requests
 * may still be attempted (earliest eligible whose qty fits).
 */
import { asc, eq } from "drizzle-orm";

import type { BookEventResult } from "../booking/book-event";
import type { TxDb } from "../index";
import { waitlistEntries } from "../schema/waitlist-entries";

import { promoteWaitlistEntry, readRemainingCapacity } from "./promote-waitlist-entry";

export type ProcessWaitlistResult = {
  promoted: BookEventResult[];
  skippedEntryIds: string[];
  stoppedReason: "CAPACITY" | "EMPTY" | "DONE";
};

export async function processWaitlistForEvent(
  db: TxDb,
  eventId: string,
): Promise<ProcessWaitlistResult> {
  const promoted: BookEventResult[] = [];
  const skippedEntryIds: string[] = [];

  const queue = await db
    .select()
    .from(waitlistEntries)
    .where(eq(waitlistEntries.eventId, eventId))
    .orderBy(asc(waitlistEntries.createdAt));

  const waiting = queue.filter((row) => row.status === "WAITING");
  if (waiting.length === 0) {
    return { promoted, skippedEntryIds, stoppedReason: "EMPTY" };
  }

  let remaining = await readRemainingCapacity(db, eventId);
  if (remaining === null) {
    return { promoted, skippedEntryIds, stoppedReason: "EMPTY" };
  }

  for (const entry of waiting) {
    if (remaining <= 0) {
      return { promoted, skippedEntryIds, stoppedReason: "CAPACITY" };
    }

    // Qty does not fit yet — leave WAITING, do not set skipped_once; try later entries.
    if (entry.requestedQty > remaining) {
      continue;
    }

    const outcome = await promoteWaitlistEntry(db, entry.id);

    if (outcome.kind === "promoted") {
      promoted.push(outcome.booking);
      remaining = (await readRemainingCapacity(db, eventId)) ?? 0;
      continue;
    }

    if (outcome.kind === "already_promoted") {
      if (outcome.booking) {
        promoted.push(outcome.booking);
      }
      remaining = (await readRemainingCapacity(db, eventId)) ?? 0;
      continue;
    }

    if (outcome.kind === "skipped") {
      skippedEntryIds.push(entry.id);
      continue;
    }

    if (outcome.kind === "capacity") {
      return { promoted, skippedEntryIds, stoppedReason: "CAPACITY" };
    }
  }

  return {
    promoted,
    skippedEntryIds,
    stoppedReason: remaining <= 0 ? "CAPACITY" : "DONE",
  };
}
