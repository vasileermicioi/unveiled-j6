import type { Story } from "@ladle/react";
import type { Subscription } from "@unveiled/db";

import { getBillingCopy } from "../../lib/billing-content";
import { getProfileCopy } from "../../lib/profile-content";
import { storyLocale } from "../stories/fixtures";
import { ProfilePage } from "./ProfilePage";

const copy = getProfileCopy(storyLocale);
const billingCopy = getBillingCopy(storyLocale);
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
  <ProfilePage copy={copy} locale={storyLocale} subscription={mockSubscription()} />
);
Active.storyName = "ProfilePage / Active membership";

export const Inactive: Story = () => (
  <ProfilePage
    copy={copy}
    locale={storyLocale}
    subscription={mockSubscription({
      status: "INACTIVE",
      stripeCustomerId: null,
      stripeSubscriptionId: null,
    })}
  />
);
Inactive.storyName = "ProfilePage / Inactive";

export const PortalError: Story = () => (
  <ProfilePage
    copy={copy}
    error={billingCopy.portalError}
    locale={storyLocale}
    subscription={mockSubscription()}
  />
);
PortalError.storyName = "ProfilePage / Portal error";
