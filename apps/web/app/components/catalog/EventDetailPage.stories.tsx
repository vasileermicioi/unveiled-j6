import type { Story } from "@ladle/react";

import { mockEvent, mockSoldOutEvent, storyLocale } from "../stories/fixtures";
import { EventDetailPage } from "./EventDetailPage";

export const Guest: Story = () => (
  <EventDetailPage closeHref={`/${storyLocale}`} event={mockEvent} locale={storyLocale} />
);
Guest.storyName = "EventDetailPage / Guest";

export const Eligible: Story = () => (
  <EventDetailPage
    closeHref={`/${storyLocale}/events`}
    event={mockEvent}
    locale={storyLocale}
    viewer={{ kind: "eligible" }}
  />
);
Eligible.storyName = "EventDetailPage / Eligible";

export const SoldOut: Story = () => (
  <EventDetailPage
    closeHref={`/${storyLocale}/events`}
    event={mockSoldOutEvent}
    locale={storyLocale}
    viewer={{ kind: "eligible" }}
  />
);
SoldOut.storyName = "EventDetailPage / Sold out";

export const MembershipRequired: Story = () => (
  <EventDetailPage
    closeHref={`/${storyLocale}/events`}
    event={mockEvent}
    locale={storyLocale}
    viewer={{ kind: "membership_required" }}
  />
);
MembershipRequired.storyName = "EventDetailPage / Membership required";

export const PastDue: Story = () => (
  <EventDetailPage
    closeHref={`/${storyLocale}/events`}
    event={mockEvent}
    locale={storyLocale}
    viewer={{ kind: "past_due" }}
  />
);
PastDue.storyName = "EventDetailPage / Past due";
