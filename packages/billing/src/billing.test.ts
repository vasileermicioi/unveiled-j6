import { describe, expect, test } from "bun:test";
import { createDb, createTxDb, creditLedger, eq, subscriptions, users } from "@unveiled/db";
import type Stripe from "stripe";

import {
  activateOrRenewCredits,
  applyStripeEvent,
  applySubscriptionDeleted,
  applySubscriptionUpdated,
  cancelSubscriptionAtPeriodEnd,
  constructStripeEvent,
  createBillingPortalSession,
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

describe("createBillingPortalSession", () => {
  test("calls billingPortal.sessions.create with customer and return_url", async () => {
    const create = async (params: Stripe.BillingPortal.SessionCreateParams) => {
      expect(params.customer).toBe("cus_portal_test");
      expect(params.return_url).toBe("https://example.test/en/profile/billing");
      return {
        id: "bps_test",
        object: "billing_portal.session",
        url: "https://billing.stripe.com/session/test",
        customer: params.customer,
        return_url: params.return_url,
      } as Stripe.BillingPortal.Session;
    };

    const stripe = {
      billingPortal: { sessions: { create } },
    } as unknown as Stripe;

    const session = await createBillingPortalSession({
      stripe,
      customerId: "cus_portal_test",
      returnUrl: "https://example.test/en/profile/billing",
    });

    expect(session.id).toBe("bps_test");
    expect(session.url).toBe("https://billing.stripe.com/session/test");
  });
});

describe("cancelSubscriptionAtPeriodEnd", () => {
  test("sets cancel_at_period_end and syncs CANCELLED_PENDING via lifecycle", async () => {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.warn("Skipping cancelSubscriptionAtPeriodEnd integration test (DATABASE_URL unset)");
      return;
    }

    const httpDb = createDb(databaseUrl);
    const txDb = createTxDb(databaseUrl);
    const userId = `billing-cancel-${crypto.randomUUID()}`;
    const email = `${userId}@example.com`;
    const stripeSubscriptionId = `sub_${userId}`;
    const stripeCustomerId = `cus_${userId}`;

    const update = async (
      id: string,
      params: Stripe.SubscriptionUpdateParams,
    ): Promise<Stripe.Subscription> => {
      expect(id).toBe(stripeSubscriptionId);
      expect(params.cancel_at_period_end).toBe(true);
      return {
        id: stripeSubscriptionId,
        object: "subscription",
        status: "active",
        cancel_at_period_end: true,
        customer: stripeCustomerId,
        items: {
          object: "list",
          data: [{ current_period_end: 1_900_000_000 }],
          has_more: false,
          url: "",
        },
      } as unknown as Stripe.Subscription;
    };

    const stripe = {
      subscriptions: { update },
    } as unknown as Stripe;

    try {
      await httpDb.insert(users).values({
        id: userId,
        email,
        emailVerified: true,
        credits: MONTHLY_CREDIT_ALLOWANCE,
      });
      await httpDb.insert(subscriptions).values({
        userId,
        status: "ACTIVE",
        plan: "Basic Berlin",
        stripeCustomerId,
        stripeSubscriptionId,
        periodEnd: new Date("2030-01-01T00:00:00.000Z"),
      });

      const result = await cancelSubscriptionAtPeriodEnd({
        stripe,
        stripeSubscriptionId,
        stripeCustomerId,
        db: txDb,
      });

      expect(result.subscription.cancel_at_period_end).toBe(true);
      expect(result.local?.applied).toBe(true);
      expect(result.local?.status).toBe("CANCELLED_PENDING");

      const after = await httpDb.query.subscriptions.findFirst({
        where: (fields, { eq: eqOp }) => eqOp(fields.userId, userId),
      });
      expect(after?.status).toBe("CANCELLED_PENDING");
    } finally {
      await httpDb.delete(creditLedger).where(eq(creditLedger.userId, userId));
      await httpDb.delete(subscriptions).where(eq(subscriptions.userId, userId));
      await httpDb.delete(users).where(eq(users.id, userId));
      await txDb.pool.end().catch(() => undefined);
    }
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

      const ledgerAfterRenewal = await httpDb.query.creditLedger.findMany({
        where: (fields, { eq: eqOp }) => eqOp(fields.userId, userId),
      });
      const expiryRows = ledgerAfterRenewal.filter((row) => row.type === "EXPIRY");
      expect(expiryRows.length).toBeGreaterThanOrEqual(2);
      expect(ledgerAfterRenewal.filter((row) => row.type === "SUBSCRIPTION_REFILL").length).toBe(2);

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
