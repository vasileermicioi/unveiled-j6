import { createDb, eq, type SubscriptionStatus, subscriptions, users } from "@unveiled/db";

/**
 * Harness-only billing state setup for Phase 6 Playwright specs.
 * Prefer Stripe test mode + webhooks for real activation; use these helpers
 * when Checkout cannot be driven (CI without stripe listen). Not a product API.
 */

export function hasDatabaseUrl(): boolean {
  return Boolean(process.env.DATABASE_URL?.trim());
}

export function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    throw new Error(
      "DATABASE_URL is required for billing E2E fixtures. See e2e/README.md (Stripe / payments).",
    );
  }
  return url;
}

/** True when operators opt into driving hosted Stripe Checkout in Playwright. */
export function stripeCheckoutE2eEnabled(): boolean {
  return process.env.E2E_STRIPE_CHECKOUT === "1";
}

export async function getUserIdByEmail(email: string): Promise<string> {
  const db = createDb(requireDatabaseUrl());
  const row = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (!row) {
    throw new Error(`public.users row not found for email: ${email}`);
  }
  return row.id;
}

export async function getUserCredits(email: string): Promise<number> {
  const db = createDb(requireDatabaseUrl());
  const row = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (!row) {
    throw new Error(`public.users row not found for email: ${email}`);
  }
  return row.credits;
}

export async function getSubscriptionStatus(email: string): Promise<SubscriptionStatus | null> {
  const db = createDb(requireDatabaseUrl());
  const userId = await getUserIdByEmail(email);
  const row = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });
  return row?.status ?? null;
}

export async function setSubscriptionStatus(
  email: string,
  status: SubscriptionStatus,
): Promise<void> {
  const db = createDb(requireDatabaseUrl());
  const userId = await getUserIdByEmail(email);
  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, userId),
  });
  if (!existing) {
    await db.insert(subscriptions).values({
      userId,
      status,
      plan: "BASIC_BERLIN",
    });
    return;
  }
  await db
    .update(subscriptions)
    .set({ status, updatedAt: new Date() })
    .where(eq(subscriptions.userId, userId));
}

export async function setCreditBalance(email: string, credits: number): Promise<void> {
  if (credits < 0) {
    throw new Error("credits must be non-negative");
  }
  const db = createDb(requireDatabaseUrl());
  const userId = await getUserIdByEmail(email);
  await db.update(users).set({ credits, updatedAt: new Date() }).where(eq(users.id, userId));
}

/** Make a member bookable: ACTIVE + enough credits for typical seed events (creditPrice 1–2). */
export async function activateMemberForBooking(email: string, credits = 17): Promise<void> {
  await setSubscriptionStatus(email, "ACTIVE");
  await setCreditBalance(email, credits);
}
