import type { Story } from "@ladle/react";
import type { Subscription } from "@unveiled/db";

import { getBillingCopy } from "../../lib/billing-content";
import { storyLocale } from "../stories/fixtures";
import { BillingPage } from "./BillingPage";

const copy = getBillingCopy(storyLocale);
const storyNow = new Date("2026-08-15T19:00:00+02:00");
const periodEnd = new Date("2026-09-15T12:00:00+02:00");

function mockSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    userId: "story-user-001",
    status: "ACTIVE",
    periodEnd,
    plan: "BASIC_BERLIN",
    stripeCustomerId: "cus_story",
    stripeSubscriptionId: "sub_story",
    paymentMethod: "CARD",
    billingAddress: "Berlin, Germany",
    createdAt: storyNow,
    updatedAt: storyNow,
    ...overrides,
  };
}

export const Active: Story = () => (
  <BillingPage copy={copy} locale={storyLocale} subscription={mockSubscription()} />
);
Active.storyName = "BillingPage / Active";

export const PastDue: Story = () => (
  <BillingPage
    copy={copy}
    locale={storyLocale}
    subscription={mockSubscription({ status: "PAST_DUE" })}
  />
);
PastDue.storyName = "BillingPage / Past due";

export const CancelledPending: Story = () => (
  <BillingPage
    copy={copy}
    locale={storyLocale}
    subscription={mockSubscription({ status: "CANCELLED_PENDING" })}
  />
);
CancelledPending.storyName = "BillingPage / Cancelled pending";

export const Inactive: Story = () => (
  <BillingPage
    copy={copy}
    locale={storyLocale}
    subscription={mockSubscription({
      status: "INACTIVE",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      paymentMethod: null,
      billingAddress: null,
      periodEnd: null,
    })}
  />
);
Inactive.storyName = "BillingPage / Inactive";

export const MissingCustomer: Story = () => (
  <BillingPage
    copy={copy}
    error={copy.portalMissingCustomer}
    locale={storyLocale}
    subscription={mockSubscription({
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    })}
  />
);
MissingCustomer.storyName = "BillingPage / Missing customer";
