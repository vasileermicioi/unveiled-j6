import { creditLedger, eq, type Subscription, subscriptions, type TxDb, users } from "@unveiled/db";

import { BASIC_BERLIN_PLAN, MONTHLY_CREDIT_ALLOWANCE } from "./checkout";

export type ActivateOrRenewInput = {
  userId: string;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  periodEnd?: Date | null;
  /** Unique key suffix (session id, invoice id, or event id). */
  idempotencySuffix: string;
};

export type MarkPastDueInput = {
  userId?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
};

export type ApplySubscriptionUpdatedInput = {
  stripeSubscriptionId: string;
  stripeCustomerId?: string | null;
  cancelAtPeriodEnd: boolean;
  stripeStatus: string;
  periodEnd?: Date | null;
};

export type ApplySubscriptionDeletedInput = {
  stripeSubscriptionId: string;
  stripeCustomerId?: string | null;
  idempotencySuffix: string;
};

function expiryKey(suffix: string): string {
  return `expiry:${suffix}`;
}

function refillKey(suffix: string): string {
  return `refill:${suffix}`;
}

async function findSubscriptionByStripeIds(
  tx: TxDb,
  options: {
    userId?: string | null;
    stripeCustomerId?: string | null;
    stripeSubscriptionId?: string | null;
  },
): Promise<Subscription | null> {
  const userId = options.userId;
  if (userId) {
    const byUser = await tx.query.subscriptions.findFirst({
      where: (fields, { eq: eqOp }) => eqOp(fields.userId, userId),
    });
    if (byUser) {
      return byUser;
    }
  }

  const stripeSubscriptionId = options.stripeSubscriptionId;
  if (stripeSubscriptionId) {
    const bySub = await tx.query.subscriptions.findFirst({
      where: (fields, { eq: eqOp }) => eqOp(fields.stripeSubscriptionId, stripeSubscriptionId),
    });
    if (bySub) {
      return bySub;
    }
  }

  const stripeCustomerId = options.stripeCustomerId;
  if (stripeCustomerId) {
    const byCustomer = await tx.query.subscriptions.findFirst({
      where: (fields, { eq: eqOp }) => eqOp(fields.stripeCustomerId, stripeCustomerId),
    });
    if (byCustomer) {
      return byCustomer;
    }
  }

  return null;
}

async function ledgerKeyExists(tx: TxDb, key: string): Promise<boolean> {
  const existing = await tx.query.creditLedger.findFirst({
    where: (fields, { eq: eqOp }) => eqOp(fields.idempotencyKey, key),
  });
  return Boolean(existing);
}

/**
 * Forfeit remaining credits (EXPIRY, amount 0 allowed), refill +17, set ACTIVE.
 * Idempotent when the refill idempotency key already exists.
 * Does not change status when the member is admin-frozen (`UNPAID`).
 */
export async function activateOrRenewCredits(
  db: TxDb,
  input: ActivateOrRenewInput,
): Promise<{ applied: boolean; status: Subscription["status"] | null }> {
  return db.transaction(async (tx) => {
    const locked = await tx
      .select({ id: users.id, credits: users.credits })
      .from(users)
      .where(eq(users.id, input.userId))
      .for("update");

    const user = locked[0];
    if (!user) {
      return { applied: false, status: null };
    }

    const subscription = await tx.query.subscriptions.findFirst({
      where: (fields, { eq: eqOp }) => eqOp(fields.userId, input.userId),
    });
    if (!subscription) {
      return { applied: false, status: null };
    }

    const refillIdempotencyKey = refillKey(input.idempotencySuffix);
    if (await ledgerKeyExists(tx as unknown as TxDb, refillIdempotencyKey)) {
      return { applied: false, status: subscription.status };
    }

    const currentCredits = user.credits;
    const now = new Date();
    const expiryIdempotencyKey = expiryKey(input.idempotencySuffix);

    if (!(await ledgerKeyExists(tx as unknown as TxDb, expiryIdempotencyKey))) {
      await tx.insert(creditLedger).values({
        userId: input.userId,
        amount: currentCredits === 0 ? 0 : -currentCredits,
        balanceAfter: 0,
        type: "EXPIRY",
        description: "Credit expiry at period boundary",
        idempotencyKey: expiryIdempotencyKey,
        timestamp: now,
      });
    }

    await tx.insert(creditLedger).values({
      userId: input.userId,
      amount: MONTHLY_CREDIT_ALLOWANCE,
      balanceAfter: MONTHLY_CREDIT_ALLOWANCE,
      type: "SUBSCRIPTION_REFILL",
      description: "Subscription refill",
      idempotencyKey: refillIdempotencyKey,
      timestamp: now,
    });

    await tx
      .update(users)
      .set({ credits: MONTHLY_CREDIT_ALLOWANCE, updatedAt: now })
      .where(eq(users.id, input.userId));

    // Admin freeze must not be cleared by Stripe activation/renewal webhooks.
    const nextStatus = subscription.status === "UNPAID" ? "UNPAID" : "ACTIVE";

    await tx
      .update(subscriptions)
      .set({
        status: nextStatus,
        plan: BASIC_BERLIN_PLAN,
        stripeCustomerId: input.stripeCustomerId ?? subscription.stripeCustomerId,
        stripeSubscriptionId: input.stripeSubscriptionId ?? subscription.stripeSubscriptionId,
        periodEnd: input.periodEnd ?? subscription.periodEnd,
        updatedAt: now,
      })
      .where(eq(subscriptions.userId, input.userId));

    return { applied: true, status: nextStatus };
  });
}

/**
 * Set PAST_DUE on failed renewal. Never overwrites admin-frozen UNPAID.
 */
export async function markPastDue(
  db: TxDb,
  input: MarkPastDueInput,
): Promise<{ applied: boolean }> {
  return db.transaction(async (tx) => {
    const subscription = await findSubscriptionByStripeIds(tx as unknown as TxDb, input);
    if (!subscription) {
      return { applied: false };
    }

    if (subscription.status === "UNPAID") {
      return { applied: false };
    }

    if (subscription.status === "PAST_DUE") {
      return { applied: false };
    }

    await tx
      .update(subscriptions)
      .set({ status: "PAST_DUE", updatedAt: new Date() })
      .where(eq(subscriptions.userId, subscription.userId));

    return { applied: true };
  });
}

/**
 * Sync cancel-at-period-end → CANCELLED_PENDING; recover PAST_DUE → ACTIVE (no refill).
 * Never clears UNPAID.
 */
export async function applySubscriptionUpdated(
  db: TxDb,
  input: ApplySubscriptionUpdatedInput,
): Promise<{ applied: boolean; status: Subscription["status"] | null }> {
  return db.transaction(async (tx) => {
    const subscription = await findSubscriptionByStripeIds(tx as unknown as TxDb, {
      stripeSubscriptionId: input.stripeSubscriptionId,
      stripeCustomerId: input.stripeCustomerId,
    });
    if (!subscription) {
      return { applied: false, status: null };
    }

    const now = new Date();
    let nextStatus = subscription.status;

    if (subscription.status !== "UNPAID") {
      if (input.cancelAtPeriodEnd) {
        nextStatus = "CANCELLED_PENDING";
      } else if (input.stripeStatus === "active" && subscription.status === "PAST_DUE") {
        nextStatus = "ACTIVE";
      } else if (input.stripeStatus === "active" && subscription.status === "INACTIVE") {
        // Portal / Dashboard reactivation without a new Checkout refill cycle.
        nextStatus = "ACTIVE";
      } else if (
        input.stripeStatus === "canceled" ||
        input.stripeStatus === "unpaid" ||
        input.stripeStatus === "incomplete_expired"
      ) {
        // Deletion path usually handles full end; keep sync conservative here.
        nextStatus = subscription.status;
      }
    }

    await tx
      .update(subscriptions)
      .set({
        status: nextStatus,
        stripeCustomerId: input.stripeCustomerId ?? subscription.stripeCustomerId,
        stripeSubscriptionId: input.stripeSubscriptionId,
        periodEnd: input.periodEnd ?? subscription.periodEnd,
        updatedAt: now,
      })
      .where(eq(subscriptions.userId, subscription.userId));

    return { applied: true, status: nextStatus };
  });
}

/**
 * Period ended / subscription deleted → INACTIVE + EXPIRY remaining credits.
 */
export async function applySubscriptionDeleted(
  db: TxDb,
  input: ApplySubscriptionDeletedInput,
): Promise<{ applied: boolean }> {
  return db.transaction(async (tx) => {
    const subscription = await findSubscriptionByStripeIds(tx as unknown as TxDb, {
      stripeSubscriptionId: input.stripeSubscriptionId,
      stripeCustomerId: input.stripeCustomerId,
    });
    if (!subscription) {
      return { applied: false };
    }

    const locked = await tx
      .select({ id: users.id, credits: users.credits })
      .from(users)
      .where(eq(users.id, subscription.userId))
      .for("update");

    const user = locked[0];
    if (!user) {
      return { applied: false };
    }

    const now = new Date();
    const expiryIdempotencyKey = expiryKey(input.idempotencySuffix);

    if (!(await ledgerKeyExists(tx as unknown as TxDb, expiryIdempotencyKey))) {
      const currentCredits = user.credits;
      await tx.insert(creditLedger).values({
        userId: subscription.userId,
        amount: currentCredits === 0 ? 0 : -currentCredits,
        balanceAfter: 0,
        type: "EXPIRY",
        description: "Credit expiry at subscription end",
        idempotencyKey: expiryIdempotencyKey,
        timestamp: now,
      });

      await tx
        .update(users)
        .set({ credits: 0, updatedAt: now })
        .where(eq(users.id, subscription.userId));
    }

    // Keep Stripe IDs for audit; status gates booking/checkout.
    // Do not clear UNPAID via deletion either — freeze is admin-owned — but a
    // fully deleted Stripe sub still ends membership access as INACTIVE unless frozen.
    const nextStatus = subscription.status === "UNPAID" ? "UNPAID" : "INACTIVE";

    await tx
      .update(subscriptions)
      .set({
        status: nextStatus,
        periodEnd: now,
        updatedAt: now,
      })
      .where(eq(subscriptions.userId, subscription.userId));

    return { applied: true };
  });
}

/** Resolve app user id from Checkout Session metadata / client_reference_id. */
export function resolveUserIdFromCheckoutSession(session: {
  client_reference_id?: string | null;
  metadata?: StripeMetadata | null;
}): string | null {
  return session.client_reference_id ?? session.metadata?.userId ?? null;
}

type StripeMetadata = { [key: string]: string };

export function periodEndFromUnix(seconds: number | null | undefined): Date | null {
  if (seconds == null) {
    return null;
  }
  return new Date(seconds * 1000);
}

/** Test helper: detect duplicate key errors from unique idempotency indexes. */
export function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const code = "code" in error ? String(error.code) : "";
  const message = "message" in error ? String(error.message) : "";
  return code === "23505" || message.toLowerCase().includes("duplicate");
}
