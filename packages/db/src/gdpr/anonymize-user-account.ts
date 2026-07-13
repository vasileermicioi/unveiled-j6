import { eq } from "drizzle-orm";

import type { TxDb } from "../index";
import { savedEvents } from "../schema/saved-events";
import { type SubscriptionStatus, subscriptions } from "../schema/subscriptions";
import { users } from "../schema/users";
import { waitlistEntries } from "../schema/waitlist-entries";

import { GdprError } from "./errors";
import {
  type CancelSubscriptionForDeletionFn,
  type DisableAuthUserFn,
  deletedEmailPlaceholder,
  type GdprDeletionActor,
} from "./types";

const CANCELABLE_STATUSES: ReadonlySet<SubscriptionStatus> = new Set([
  "ACTIVE",
  "PAST_DUE",
  "UNPAID",
  "CANCELLED_PENDING",
]);

export type AnonymizeUserAccountInput = {
  userId: string;
  actor: GdprDeletionActor;
  /** Required when actor is `admin` — audit metadata only (no audit table this step). */
  adminId?: string;
  disableAuthUser: DisableAuthUserFn;
  /** Optional; wraps billing cancel-at-period-end. No-op when unset or not cancelable. */
  cancelSubscription?: CancelSubscriptionForDeletionFn;
};

export type AnonymizeUserAccountResult = {
  userId: string;
  deletedAt: Date;
  actor: GdprDeletionActor;
  adminId?: string;
};

type PendingCancel = {
  stripeSubscriptionId: string;
  stripeCustomerId: string | null;
};

type AnonymizeTxResult = {
  deletedAt: Date;
  pendingCancel: PendingCancel | null;
};

/**
 * Shared GDPR anonymization for self-service and admin-assisted deletion.
 *
 * - Anonymizes `public.users` PII and sets `deleted_at`.
 * - Deletes `saved_events` and `waitlist_entries` (not retention-required).
 * - Retains `bookings` and `credit_ledger` rows (German accounting retention).
 * - After DB commit: disables Neon Auth credentials, then cancels Stripe if needed.
 * - Does not clear session cookies (UI concern).
 *
 * Waitlist deletion mid-promotion is acceptable for GDPR; capacity frees.
 */
export async function anonymizeUserAccount(
  db: TxDb,
  input: AnonymizeUserAccountInput,
): Promise<AnonymizeUserAccountResult> {
  if (input.actor === "admin" && !input.adminId?.trim()) {
    throw new GdprError("INVALID_ACTOR", "adminId is required when actor is admin");
  }

  const { deletedAt, pendingCancel } = await db.transaction(
    async (tx): Promise<AnonymizeTxResult> => {
      const locked = await tx.select().from(users).where(eq(users.id, input.userId)).for("update");
      const user = locked[0];
      if (!user) {
        throw new GdprError("USER_NOT_FOUND", "User not found");
      }
      if (user.deletedAt) {
        throw new GdprError("ALREADY_DELETED", "User account is already deleted");
      }

      const now = new Date();

      await tx
        .update(users)
        .set({
          email: deletedEmailPlaceholder(input.userId),
          emailVerified: false,
          profile: {},
          behavior: {},
          deletedAt: now,
          updatedAt: now,
        })
        .where(eq(users.id, input.userId));

      await tx.delete(savedEvents).where(eq(savedEvents.userId, input.userId));
      await tx.delete(waitlistEntries).where(eq(waitlistEntries.userId, input.userId));

      const [subscription] = await tx
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, input.userId));

      let nextCancel: PendingCancel | null = null;
      if (subscription?.stripeSubscriptionId && CANCELABLE_STATUSES.has(subscription.status)) {
        nextCancel = {
          stripeSubscriptionId: subscription.stripeSubscriptionId,
          stripeCustomerId: subscription.stripeCustomerId ?? null,
        };
      }

      return { deletedAt: now, pendingCancel: nextCancel };
    },
  );

  try {
    await input.disableAuthUser({ userId: input.userId });
  } catch (error) {
    const detail = error instanceof Error ? error.message : "Auth disable failed";
    throw new GdprError(
      "AUTH_DISABLE_FAILED",
      `Account anonymized locally but Auth disable failed: ${detail}`,
    );
  }

  if (pendingCancel && input.cancelSubscription) {
    try {
      await input.cancelSubscription({
        userId: input.userId,
        stripeSubscriptionId: pendingCancel.stripeSubscriptionId,
        stripeCustomerId: pendingCancel.stripeCustomerId,
      });
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Subscription cancel failed";
      throw new GdprError(
        "CANCEL_FAILED",
        `Account anonymized and Auth disabled but subscription cancel failed: ${detail}`,
      );
    }
  }

  return {
    userId: input.userId,
    deletedAt,
    actor: input.actor,
    ...(input.adminId?.trim() ? { adminId: input.adminId.trim() } : {}),
  };
}
