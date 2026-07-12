import { describe, expect, test } from "bun:test";
import { createDb, createTxDb, creditLedger, eq, subscriptions, users } from "@unveiled/db";
import type Stripe from "stripe";

import {
  activateOrRenewCredits,
  applyStripeEvent,
  applySubscriptionDeleted,
  applySubscriptionUpdated,
  constructStripeEvent,
  createStripeClient,
  MONTHLY_CREDIT_ALLOWANCE,
  markPastDue,
  periodEndFromSubscription,
  periodEndFromUnix,
  resolveUserIdFromCheckoutSession,
  subscriptionIdFromInvoice,
} from "./index";

const TEST_WEBHOOK_SECRET = "whsec_test_unveiled_billing";

describe("constructStripeEvent", () => {
  test("accepts a valid signed payload", async () => {
    const stripe = createStripeClient("sk_test_construct");
    const payload = JSON.stringify({
      id: "evt_test_valid",
      object: "event",
      type: "invoice.payment_failed",
      data: { object: { id: "in_test", object: "invoice" } },
    });
    const signature = await stripe.webhooks.generateTestHeaderStringAsync({
      payload,
      secret: TEST_WEBHOOK_SECRET,
    });

    const event = await constructStripeEvent(stripe, payload, signature, TEST_WEBHOOK_SECRET);
    expect(event.id).toBe("evt_test_valid");
    expect(event.type).toBe("invoice.payment_failed");
  });

  test("rejects an invalid signature", async () => {
    const stripe = createStripeClient("sk_test_construct");
    const payload = JSON.stringify({
      id: "evt_test_invalid",
      object: "event",
      type: "invoice.payment_failed",
      data: { object: {} },
    });

    await expect(
      constructStripeEvent(stripe, payload, "t=1,v1=deadbeef", TEST_WEBHOOK_SECRET),
    ).rejects.toThrow();
  });
});

describe("Stripe payload helpers", () => {
  test("resolveUserIdFromCheckoutSession prefers client_reference_id", () => {
    expect(
      resolveUserIdFromCheckoutSession({
        client_reference_id: "user_a",
        metadata: { userId: "user_b" },
      }),
    ).toBe("user_a");
    expect(
      resolveUserIdFromCheckoutSession({
        client_reference_id: null,
        metadata: { userId: "user_b" },
      }),
    ).toBe("user_b");
  });

  test("subscriptionIdFromInvoice reads parent.subscription_details", () => {
    const invoice = {
      parent: {
        type: "subscription_details",
        subscription_details: {
          subscription: "sub_123",
        },
        quote_details: null,
      },
    } as Stripe.Invoice;

    expect(subscriptionIdFromInvoice(invoice)).toBe("sub_123");
  });

  test("periodEndFromSubscription reads subscription item period", () => {
    const sub = {
      items: {
        object: "list",
        data: [{ current_period_end: 1_700_000_000 }],
        has_more: false,
        url: "",
      },
    } as Stripe.Subscription;

    expect(periodEndFromSubscription(sub)?.getTime()).toBe(
      periodEndFromUnix(1_700_000_000)?.getTime(),
    );
  });
});

describe("subscription lifecycle (integration)", () => {
  const databaseUrl = process.env.DATABASE_URL;

  test("activateOrRenew, past due, cancel, delete, and idempotent retry", async () => {
    if (!databaseUrl) {
      console.warn("Skipping billing lifecycle integration test (DATABASE_URL unset)");
      return;
    }

    const httpDb = createDb(databaseUrl);
    const txDb = createTxDb(databaseUrl);
    const userId = `billing-test-${crypto.randomUUID()}`;
    const email = `${userId}@example.com`;

    try {
      await httpDb.insert(users).values({
        id: userId,
        email,
        emailVerified: true,
        credits: 5,
      });
      await httpDb.insert(subscriptions).values({
        userId,
        status: "INACTIVE",
        plan: "Basic Berlin",
      });

      const first = await activateOrRenewCredits(txDb, {
        userId,
        stripeCustomerId: `cus_${userId}`,
        stripeSubscriptionId: `sub_${userId}`,
        periodEnd: new Date("2030-01-01T00:00:00.000Z"),
        idempotencySuffix: "session_1",
      });
      expect(first.applied).toBe(true);
      expect(first.status).toBe("ACTIVE");

      const afterActivate = await httpDb.query.users.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, userId),
      });
      expect(afterActivate?.credits).toBe(MONTHLY_CREDIT_ALLOWANCE);

      const ledgerAfterActivate = await httpDb.query.creditLedger.findMany({
        where: (fields, { eq: eqOp }) => eqOp(fields.userId, userId),
      });
      expect(ledgerAfterActivate.some((row) => row.type === "EXPIRY")).toBe(true);
      expect(ledgerAfterActivate.some((row) => row.type === "SUBSCRIPTION_REFILL")).toBe(true);

      const retry = await activateOrRenewCredits(txDb, {
        userId,
        stripeCustomerId: `cus_${userId}`,
        stripeSubscriptionId: `sub_${userId}`,
        idempotencySuffix: "session_1",
      });
      expect(retry.applied).toBe(false);

      await httpDb.update(users).set({ credits: 9 }).where(eq(users.id, userId));

      const renewal = await activateOrRenewCredits(txDb, {
        userId,
        stripeCustomerId: `cus_${userId}`,
        stripeSubscriptionId: `sub_${userId}`,
        idempotencySuffix: "inv_cycle_1",
      });
      expect(renewal.applied).toBe(true);

      const afterRenewal = await httpDb.query.users.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, userId),
      });
      expect(afterRenewal?.credits).toBe(MONTHLY_CREDIT_ALLOWANCE);

      const pastDue = await markPastDue(txDb, {
        stripeSubscriptionId: `sub_${userId}`,
      });
      expect(pastDue.applied).toBe(true);

      const afterPastDue = await httpDb.query.subscriptions.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.userId, userId),
      });
      expect(afterPastDue?.status).toBe("PAST_DUE");

      const updated = await applySubscriptionUpdated(txDb, {
        stripeSubscriptionId: `sub_${userId}`,
        cancelAtPeriodEnd: true,
        stripeStatus: "active",
        periodEnd: new Date("2030-02-01T00:00:00.000Z"),
      });
      expect(updated.status).toBe("CANCELLED_PENDING");

      await httpDb.update(users).set({ credits: 3 }).where(eq(users.id, userId));

      const deleted = await applySubscriptionDeleted(txDb, {
        stripeSubscriptionId: `sub_${userId}`,
        idempotencySuffix: "evt_deleted_1",
      });
      expect(deleted.applied).toBe(true);

      const afterDelete = await httpDb.query.subscriptions.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.userId, userId),
      });
      const userAfterDelete = await httpDb.query.users.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.id, userId),
      });
      expect(afterDelete?.status).toBe("INACTIVE");
      expect(userAfterDelete?.credits).toBe(0);

      // UNPAID must not flip to PAST_DUE / ACTIVE via webhooks
      await httpDb
        .update(subscriptions)
        .set({ status: "UNPAID", stripeSubscriptionId: `sub_${userId}_frozen` })
        .where(eq(subscriptions.userId, userId));

      const unpaidPastDue = await markPastDue(txDb, {
        stripeSubscriptionId: `sub_${userId}_frozen`,
      });
      expect(unpaidPastDue.applied).toBe(false);

      const unpaidActivate = await activateOrRenewCredits(txDb, {
        userId,
        stripeSubscriptionId: `sub_${userId}_frozen`,
        idempotencySuffix: "session_frozen",
      });
      expect(unpaidActivate.status).toBe("UNPAID");

      const stripe = createStripeClient("sk_test_apply");
      const failedInvoiceEvent = {
        id: "evt_payment_failed_fixture",
        object: "event",
        type: "invoice.payment_failed",
        data: {
          object: {
            id: "in_failed",
            object: "invoice",
            customer: null,
            parent: {
              type: "subscription_details",
              subscription_details: {
                subscription: `sub_${userId}_frozen`,
              },
              quote_details: null,
            },
          },
        },
      } as unknown as Stripe.Event;

      await httpDb
        .update(subscriptions)
        .set({ status: "ACTIVE", stripeSubscriptionId: `sub_${userId}_active2` })
        .where(eq(subscriptions.userId, userId));

      const applyFailed = await applyStripeEvent(txDb, {
        ...failedInvoiceEvent,
        data: {
          object: {
            id: "in_failed",
            object: "invoice",
            customer: null,
            parent: {
              type: "subscription_details",
              subscription_details: {
                subscription: `sub_${userId}_active2`,
              },
              quote_details: null,
            },
          },
        },
      } as unknown as Stripe.Event);
      expect(applyFailed.handled).toBe(true);

      void stripe;
      void creditLedger;
    } finally {
      await httpDb.delete(creditLedger).where(eq(creditLedger.userId, userId));
      await httpDb.delete(subscriptions).where(eq(subscriptions.userId, userId));
      await httpDb.delete(users).where(eq(users.id, userId));
      await txDb.pool.end().catch(() => undefined);
    }
  });
});
