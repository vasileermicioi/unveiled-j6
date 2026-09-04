import { describe, expect, test } from "bun:test";
import type Stripe from "stripe";

import {
  type CancellationEmailMember,
  lookupCancellationMemberByStripeSubscriptionId,
  type MaybeSendSubscriptionCancellationEmailInput,
  maybeSendSubscriptionCancellationEmail,
} from "./subscription-cancellation-email";

const SITE_URL = "https://example.test";
const PERIOD_END_UNIX = 1914451199;

function subscriptionFixture(overrides: Record<string, unknown> = {}): Stripe.Subscription {
  return {
    id: "sub_test",
    object: "subscription",
    status: "active",
    cancel_at_period_end: true,
    cancel_at: PERIOD_END_UNIX,
    customer: "cus_test",
    metadata: { locale: "en", userId: "user_1" },
    items: { data: [{ current_period_end: PERIOD_END_UNIX }] },
    ...overrides,
  } as unknown as Stripe.Subscription;
}

function subscriptionUpdatedEvent(sub: Stripe.Subscription): Stripe.Event {
  return {
    id: "evt_cancel_1",
    object: "event",
    type: "customer.subscription.updated",
    data: { object: sub },
  } as unknown as Stripe.Event;
}

function baseInput(
  overrides: Partial<MaybeSendSubscriptionCancellationEmailInput> = {},
): MaybeSendSubscriptionCancellationEmailInput {
  return {
    event: subscriptionUpdatedEvent(subscriptionFixture()),
    stripe: {} as Stripe,
    apiKey: "re_test",
    from: "codes@unveiled.berlin",
    siteUrl: SITE_URL,
    previousStatus: "ACTIVE",
    lookupMemberByStripeSubscriptionId: async () => ({
      email: "member@example.com",
      profileLanguage: "DE",
      periodEnd: new Date("2030-09-30T21:59:59.000Z"),
    }),
    ...overrides,
  };
}

describe("maybeSendSubscriptionCancellationEmail", () => {
  test("scheduled-cancel transition sends once with event-id idempotency", async () => {
    const sendCalls: Array<{
      toEmail: string;
      locale: string;
      endDate: Date;
      resubscribeUrl: string;
      key?: string;
    }> = [];

    const result = await maybeSendSubscriptionCancellationEmail(
      baseInput({
        sendCancellation: async (input) => {
          sendCalls.push({
            toEmail: input.toEmail,
            locale: input.locale,
            endDate: input.endDate,
            resubscribeUrl: input.resubscribeUrl,
            key: input.idempotencyKey,
          });
          return { ok: true, status: 200, id: "email_1" };
        },
      }),
    );

    expect(result).toEqual({ status: "sent" });
    expect(sendCalls).toHaveLength(1);
    expect(sendCalls[0]?.toEmail).toBe("member@example.com");
    expect(sendCalls[0]?.locale).toBe("en");
    expect(sendCalls[0]?.endDate).toEqual(new Date(PERIOD_END_UNIX * 1000));
    expect(sendCalls[0]?.resubscribeUrl).toBe(`${SITE_URL}/en/membership`);
    expect(sendCalls[0]?.key).toBe("evt_cancel_1");
  });

  test("non-update events do not send", async () => {
    let sent = 0;
    const result = await maybeSendSubscriptionCancellationEmail(
      baseInput({
        event: { type: "invoice.paid", data: { object: {} } } as Stripe.Event,
        sendCancellation: async () => {
          sent += 1;
          return { ok: true, status: 200 };
        },
      }),
    );

    expect(result).toEqual({ status: "skipped", reason: "not_subscription_updated" });
    expect(sent).toBe(0);
  });

  test("subscription deletion does not send", async () => {
    let sent = 0;
    const result = await maybeSendSubscriptionCancellationEmail(
      baseInput({
        event: { type: "customer.subscription.deleted", data: { object: {} } } as Stripe.Event,
        sendCancellation: async () => {
          sent += 1;
          return { ok: true, status: 200 };
        },
      }),
    );

    expect(result).toEqual({ status: "skipped", reason: "not_subscription_updated" });
    expect(sent).toBe(0);
  });

  test("update without cancel_at_period_end does not send", async () => {
    let sent = 0;
    const result = await maybeSendSubscriptionCancellationEmail(
      baseInput({
        event: subscriptionUpdatedEvent(subscriptionFixture({ cancel_at_period_end: false })),
        sendCancellation: async () => {
          sent += 1;
          return { ok: true, status: 200 };
        },
      }),
    );

    expect(result).toEqual({ status: "skipped", reason: "not_scheduled_cancel" });
    expect(sent).toBe(0);
  });

  test("already-pending subscription does not resend", async () => {
    let sent = 0;
    const result = await maybeSendSubscriptionCancellationEmail(
      baseInput({
        previousStatus: "CANCELLED_PENDING",
        sendCancellation: async () => {
          sent += 1;
          return { ok: true, status: 200 };
        },
      }),
    );

    expect(result).toEqual({ status: "skipped", reason: "already_pending" });
    expect(sent).toBe(0);
  });

  test("admin-frozen subscription does not send", async () => {
    let sent = 0;
    const result = await maybeSendSubscriptionCancellationEmail(
      baseInput({
        previousStatus: "UNPAID",
        sendCancellation: async () => {
          sent += 1;
          return { ok: true, status: 200 };
        },
      }),
    );

    expect(result).toEqual({ status: "skipped", reason: "admin_frozen" });
    expect(sent).toBe(0);
  });

  test("missing Resend env skips without retry", async () => {
    const result = await maybeSendSubscriptionCancellationEmail(
      baseInput({
        apiKey: undefined,
        from: undefined,
        sendCancellation: async () => {
          throw new Error("should not send");
        },
      }),
    );

    expect(result).toEqual({ status: "skipped", reason: "resend_env_unset" });
  });

  test("missing recipient skips without retry", async () => {
    let sent = 0;
    const result = await maybeSendSubscriptionCancellationEmail(
      baseInput({
        lookupMemberByStripeSubscriptionId: async () => null,
        sendCancellation: async () => {
          sent += 1;
          return { ok: true, status: 200 };
        },
      }),
    );

    expect(result).toEqual({ status: "skipped", reason: "missing_recipient" });
    expect(sent).toBe(0);
  });

  test("falls back to DB email, profile language, and DB period end", async () => {
    const sendCalls: Array<{ toEmail: string; locale: string; endDate: Date }> = [];
    const dbPeriodEnd = new Date("2030-10-31T21:59:59.000Z");
    const sub = subscriptionFixture({
      metadata: {},
      items: { data: [] },
      cancel_at: null,
    });

    const result = await maybeSendSubscriptionCancellationEmail(
      baseInput({
        event: subscriptionUpdatedEvent(sub),
        lookupMemberByStripeSubscriptionId: async (id) => {
          expect(id).toBe("sub_test");
          const member: CancellationEmailMember = {
            email: "from-db@example.com",
            profileLanguage: "EN",
            periodEnd: dbPeriodEnd,
          };
          return member;
        },
        sendCancellation: async (input) => {
          sendCalls.push({
            toEmail: input.toEmail,
            locale: input.locale,
            endDate: input.endDate,
          });
          return { ok: true, status: 200 };
        },
      }),
    );

    expect(result).toEqual({ status: "sent" });
    expect(sendCalls).toEqual([
      { toEmail: "from-db@example.com", locale: "en", endDate: dbPeriodEnd },
    ]);
  });

  test("missing end date everywhere skips without retry", async () => {
    let sent = 0;
    const sub = subscriptionFixture({ items: { data: [] }, cancel_at: null });
    const result = await maybeSendSubscriptionCancellationEmail(
      baseInput({
        event: subscriptionUpdatedEvent(sub),
        lookupMemberByStripeSubscriptionId: async () => ({
          email: "member@example.com",
          profileLanguage: null,
          periodEnd: null,
        }),
        sendCancellation: async () => {
          sent += 1;
          return { ok: true, status: 200 };
        },
      }),
    );

    expect(result).toEqual({ status: "skipped", reason: "missing_end_date" });
    expect(sent).toBe(0);
  });

  test("send failure returns retry without throwing", async () => {
    const result = await maybeSendSubscriptionCancellationEmail(
      baseInput({
        sendCancellation: async () => ({ ok: false, status: 500, error: "Resend down" }),
      }),
    );

    expect(result).toEqual({ status: "retry", reason: "send_failed" });
  });

  test("send throw returns retry without throwing", async () => {
    const result = await maybeSendSubscriptionCancellationEmail(
      baseInput({
        sendCancellation: async () => {
          throw new Error("network down");
        },
      }),
    );

    expect(result).toEqual({ status: "retry", reason: "send_threw" });
  });

  test("member lookup failure retries when no fallback email exists", async () => {
    const result = await maybeSendSubscriptionCancellationEmail(
      baseInput({
        lookupMemberByStripeSubscriptionId: async () => {
          throw new Error("db down");
        },
      }),
    );

    expect(result).toEqual({ status: "retry", reason: "member_lookup_failed" });
  });

  test("member lookup failure uses expanded Stripe customer email when present", async () => {
    const sendCalls: Array<{ toEmail: string }> = [];
    const sub = subscriptionFixture({
      customer: { id: "cus_test", object: "customer", email: "stripe-customer@example.com" },
    });

    const result = await maybeSendSubscriptionCancellationEmail(
      baseInput({
        event: subscriptionUpdatedEvent(sub),
        lookupMemberByStripeSubscriptionId: async () => {
          throw new Error("db down");
        },
        sendCancellation: async (input) => {
          sendCalls.push({ toEmail: input.toEmail });
          return { ok: true, status: 200 };
        },
      }),
    );

    expect(result).toEqual({ status: "sent" });
    expect(sendCalls).toEqual([{ toEmail: "stripe-customer@example.com" }]);
  });
});

describe("lookupCancellationMemberByStripeSubscriptionId", () => {
  test("returns email, language, and period end from the subscriptions row", async () => {
    const periodEnd = new Date("2030-09-30T21:59:59.000Z");
    const db = {
      query: {
        subscriptions: {
          findFirst: async () => ({ userId: "user_1", periodEnd }),
        },
        users: {
          findFirst: async () => ({
            email: "member@example.com",
            profile: { language: "EN" },
          }),
        },
      },
    } as unknown as Parameters<typeof lookupCancellationMemberByStripeSubscriptionId>[0];

    const member = await lookupCancellationMemberByStripeSubscriptionId(db, "sub_test");
    expect(member).toEqual({ email: "member@example.com", profileLanguage: "EN", periodEnd });
  });

  test("returns null when the subscription row is missing", async () => {
    const db = {
      query: {
        subscriptions: { findFirst: async () => null },
        users: { findFirst: async () => null },
      },
    } as unknown as Parameters<typeof lookupCancellationMemberByStripeSubscriptionId>[0];

    await expect(
      lookupCancellationMemberByStripeSubscriptionId(db, "sub_missing"),
    ).resolves.toBeNull();
  });
});
