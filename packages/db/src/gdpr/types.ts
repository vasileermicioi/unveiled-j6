/**
 * Unique non-reversible email placeholder for GDPR anonymization.
 * Preserves `users.email` uniqueness; does not contain the original address.
 */
export function deletedEmailPlaceholder(userId: string): string {
  return `deleted-${userId}@deleted.local`;
}

/**
 * Neon Auth credential disable collaborator.
 * Prefer remove-user (or equivalent) so the real email does not remain in neon_auth.
 * Concrete HTTP against AUTH_URL is wired by apps/web (gdpr-rights-02).
 */
export type DisableAuthUserFn = (args: { userId: string }) => Promise<void>;

/**
 * Optional deletion side effect: cancel Stripe subscription at period end.
 * Callers wrap `@unveiled/billing` `cancelSubscriptionAtPeriodEnd` — never a parallel cancel writer.
 */
export type CancelSubscriptionForDeletionFn = (args: {
  userId: string;
  stripeSubscriptionId: string;
  stripeCustomerId: string | null;
}) => Promise<void>;

export type GdprDeletionActor = "self" | "admin";
