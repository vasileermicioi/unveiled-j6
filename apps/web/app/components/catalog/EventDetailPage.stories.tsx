import type { Story } from "@ladle/react";

import { mockEvent, mockSoldOutEvent, storyLocale } from "../stories/fixtures";
import { EventDetailPage } from "./EventDetailPage";

/** Wide frame so lg two-column identity/checkout alignment and DETAILS grid are reviewable. */
const wideMeta = { width: 1280 as const };

/** Guest preview: hard max qty 3; credit total + DETAILS date omitted; unlock CTA remains. */
export const Guest: Story = () => (
  <EventDetailPage
    closeHref={`/${storyLocale}`}
    event={mockEvent}
    locale={storyLocale}
    maxQty={3}
    viewer={{ kind: "guest" }}
  />
);
Guest.storyName = "EventDetailPage / Guest";
Guest.meta = wideMeta;

/** Eligible member: credit total + date visible; qty max = credits ∩ capacity (example 8). */
export const Eligible: Story = () => (
  <EventDetailPage
    closeHref={`/${storyLocale}/events`}
    event={mockEvent}
    locale={storyLocale}
    maxQty={8}
    viewer={{ kind: "eligible" }}
  />
);
Eligible.storyName = "EventDetailPage / Eligible";
Eligible.meta = wideMeta;

export const SoldOut: Story = () => (
  <EventDetailPage
    closeHref={`/${storyLocale}/events`}
    event={mockSoldOutEvent}
    locale={storyLocale}
    viewer={{ kind: "eligible" }}
  />
);
SoldOut.storyName = "EventDetailPage / Sold out";
SoldOut.meta = wideMeta;

export const MembershipRequired: Story = () => (
  <EventDetailPage
    closeHref={`/${storyLocale}/events`}
    event={mockEvent}
    locale={storyLocale}
    viewer={{ kind: "membership_required" }}
  />
);
MembershipRequired.storyName = "EventDetailPage / Membership required";
MembershipRequired.meta = wideMeta;

export const PastDue: Story = () => (
  <EventDetailPage
    closeHref={`/${storyLocale}/events`}
    event={mockEvent}
    locale={storyLocale}
    viewer={{ kind: "past_due" }}
  />
);
PastDue.storyName = "EventDetailPage / Past due";
PastDue.meta = wideMeta;
