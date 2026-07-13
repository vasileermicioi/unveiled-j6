import { eq } from "drizzle-orm";

import type { TxDb } from "../index";
import { type CreditLedgerEntry, creditLedger } from "../schema/credit-ledger";
import { users } from "../schema/users";

import { AdminMemberError } from "./errors";

export type RefundMemberCreditsInput = {
  userId: string;
  /** Positive amount to add; must be > 0. */
  amount: number;
  description: string;
  idempotencyKey?: string | null;
};

export type RefundMemberCreditsResult = {
  credits: number;
  ledgerEntry: CreditLedgerEntry;
};

/**
 * Manual support refund. Writes `REFUND` ledger row, decoupled from booking cancel.
 */
export async function refundMemberCredits(
  db: TxDb,
  input: RefundMemberCreditsInput,
): Promise<RefundMemberCreditsResult> {
  if (!Number.isInteger(input.amount) || input.amount <= 0) {
    throw new AdminMemberError("INVALID_AMOUNT", "Refund amount must be a positive integer");
  }
  const description = input.description.trim();
  if (!description) {
    throw new AdminMemberError("INVALID_DESCRIPTION", "Description is required");
  }

  return db.transaction(async (tx) => {
    const locked = await tx.select().from(users).where(eq(users.id, input.userId)).for("update");
    const user = locked[0];
    if (!user) {
      throw new AdminMemberError("USER_NOT_FOUND", "Member not found");
    }

    const nextCredits = user.credits + input.amount;
    const now = new Date();

    await tx
      .update(users)
      .set({ credits: nextCredits, updatedAt: now })
      .where(eq(users.id, input.userId));

    const [ledgerEntry] = await tx
      .insert(creditLedger)
      .values({
        userId: input.userId,
        amount: input.amount,
        balanceAfter: nextCredits,
        type: "REFUND",
        description,
        idempotencyKey: input.idempotencyKey?.trim() || null,
        timestamp: now,
      })
      .returning();

    if (!ledgerEntry) {
      throw new AdminMemberError("USER_NOT_FOUND", "Failed to write ledger entry");
    }

    return { credits: nextCredits, ledgerEntry };
  });
}
