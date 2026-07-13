import type { TxDb } from "../index";
import { type PromoteOutcome, promoteWaitlistEntry } from "../waitlist/promote-waitlist-entry";

export type PromoteWaitlistEntryAsAdminInput = {
  entryId: string;
  /** Trusted admin actor id for call-site audit; not used by promote path. */
  adminUserId: string;
};

/**
 * Admin manual promote — same book-then-mark path as automatic promotion,
 * even out of normal queue order. Rethrows WaitlistError / BookingError as-is.
 */
export async function promoteWaitlistEntryAsAdmin(
  db: TxDb,
  input: PromoteWaitlistEntryAsAdminInput,
): Promise<PromoteOutcome> {
  void input.adminUserId;
  return promoteWaitlistEntry(db, input.entryId);
}
