import { eq, type Subscription, subscriptions, type TxDb } from "@unveiled/db";

export type FreezeMemberInput = {
  userId: string;
};

export type FreezeMemberErrorCode = "SUBSCRIPTION_NOT_FOUND" | "INVALID_STATUS";

export class FreezeMemberError extends Error {
  readonly code: FreezeMemberErrorCode;

  constructor(code: FreezeMemberErrorCode, message: string) {
    super(message);
    this.name = "FreezeMemberError";
    this.code = code;
  }
}

export function isFreezeMemberError(error: unknown): error is FreezeMemberError {
  return error instanceof FreezeMemberError;
}

/**
 * Admin freeze: ACTIVE → UNPAID.
 *
 * Independent of Stripe PAST_DUE. Does not call Stripe. Preserves plan,
 * payment method, billing address, and Stripe customer/subscription ids.
 * Webhook lifecycle helpers already refuse to clear UNPAID.
 */
export async function freezeMember(db: TxDb, input: FreezeMemberInput): Promise<Subscription> {
  return db.transaction(async (tx) => {
    const locked = await tx
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, input.userId))
      .for("update");
    const subscription = locked[0];
    if (!subscription) {
      throw new FreezeMemberError("SUBSCRIPTION_NOT_FOUND", "Subscription not found");
    }
    if (subscription.status !== "ACTIVE") {
      throw new FreezeMemberError(
        "INVALID_STATUS",
        `Freeze requires ACTIVE status (got ${subscription.status})`,
      );
    }

    const now = new Date();
    const [updated] = await tx
      .update(subscriptions)
      .set({ status: "UNPAID", updatedAt: now })
      .where(eq(subscriptions.userId, input.userId))
      .returning();

    if (!updated) {
      throw new FreezeMemberError("SUBSCRIPTION_NOT_FOUND", "Failed to freeze subscription");
    }
    return updated;
  });
}

/**
 * Admin unfreeze: UNPAID → ACTIVE.
 *
 * Leaves Stripe ids intact. Does not recover PAST_DUE from Stripe — if Stripe
 * is still past_due after unfreeze, the next webhook may set PAST_DUE again.
 */
export async function unfreezeMember(db: TxDb, input: FreezeMemberInput): Promise<Subscription> {
  return db.transaction(async (tx) => {
    const locked = await tx
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, input.userId))
      .for("update");
    const subscription = locked[0];
    if (!subscription) {
      throw new FreezeMemberError("SUBSCRIPTION_NOT_FOUND", "Subscription not found");
    }
    if (subscription.status !== "UNPAID") {
      throw new FreezeMemberError(
        "INVALID_STATUS",
        `Unfreeze requires UNPAID status (got ${subscription.status})`,
      );
    }

    const now = new Date();
    const [updated] = await tx
      .update(subscriptions)
      .set({ status: "ACTIVE", updatedAt: now })
      .where(eq(subscriptions.userId, input.userId))
      .returning();

    if (!updated) {
      throw new FreezeMemberError("SUBSCRIPTION_NOT_FOUND", "Failed to unfreeze subscription");
    }
    return updated;
  });
}
