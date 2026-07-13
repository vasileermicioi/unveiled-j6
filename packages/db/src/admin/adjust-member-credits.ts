import { eq } from "drizzle-orm";

import type { TxDb } from "../index";
import { type CreditLedgerEntry, creditLedger } from "../schema/credit-ledger";
import { users } from "../schema/users";

import { AdminMemberError } from "./errors";

export type AdjustMemberCreditsInput = {
  userId: string;
  /** Signed delta; must be non-zero. */
  amount: number;
  description: string;
  idempotencyKey?: string | null;
};

export type AdjustMemberCreditsResult = {
  credits: number;
  ledgerEntry: CreditLedgerEntry;
};

function requireDescription(description: string): string {
  const trimmed = description.trim();
  if (!trimmed) {
    throw new AdminMemberError("INVALID_DESCRIPTION", "Description is required");
  }
  return trimmed;
}

/**
 * Admin support credit adjustment. Writes `ADMIN_ADJUST` ledger row.
 * Rejects zero amount and balances that would go negative.
 */
export async function adjustMemberCredits(
  db: TxDb,
  input: AdjustMemberCreditsInput,
): Promise<AdjustMemberCreditsResult> {
  if (!Number.isInteger(input.amount)) {
    throw new AdminMemberError("INVALID_AMOUNT", "Amount must be an integer");
  }
  if (input.amount === 0) {
    throw new AdminMemberError("ZERO_AMOUNT", "Adjustment amount must be non-zero");
  }
  const description = requireDescription(input.description);

  return db.transaction(async (tx) => {
    const locked = await tx.select().from(users).where(eq(users.id, input.userId)).for("update");
    const user = locked[0];
    if (!user) {
      throw new AdminMemberError("USER_NOT_FOUND", "Member not found");
    }

    const nextCredits = user.credits + input.amount;
    if (nextCredits < 0) {
      throw new AdminMemberError(
        "INSUFFICIENT_CREDITS",
        "Adjustment would make credit balance negative",
      );
    }

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
        type: "ADMIN_ADJUST",
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
