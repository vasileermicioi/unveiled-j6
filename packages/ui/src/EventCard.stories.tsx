import type { Story } from "@ladle/react";

import { EventCard } from "./EventCard";
import { sampleEventAvailable, sampleEventSoldOut } from "./stories/event-fixtures";

export const HoverPreview: Story = () => (
  <EventCard
    className="event-card--hover-preview"
    event={sampleEventAvailable}
    locale="en"
    viewer={{ kind: "member", subscriptionActive: true }}
  />
);
HoverPreview.storyName = "EventCard / Hover — colorized cover";

export const GuestDiscover: Story = () => (
  <EventCard event={sampleEventAvailable} locale="en" viewer={{ kind: "guest" }} />
);
GuestDiscover.storyName = "EventCard / Guest — Discover";

export const GuestDiscoverDe: Story = () => (
  <EventCard event={sampleEventAvailable} locale="de" viewer={{ kind: "guest" }} />
);
GuestDiscoverDe.storyName = "EventCard / Guest — Entdecken (de)";

export const GuestWaitlist: Story = () => (
  <EventCard event={sampleEventSoldOut} locale="en" viewer={{ kind: "guest" }} />
);
GuestWaitlist.storyName = "EventCard / Guest — Waitlist";

export const GuestWaitlistDe: Story = () => (
  <EventCard event={sampleEventSoldOut} locale="de" viewer={{ kind: "guest" }} />
);
GuestWaitlistDe.storyName = "EventCard / Guest — Warteliste (de)";

export const MemberWaitlist: Story = () => (
  <EventCard
    event={sampleEventSoldOut}
    locale="en"
    viewer={{ kind: "member", subscriptionActive: true }}
  />
);
MemberWaitlist.storyName = "EventCard / Member — Waitlist";

export const MemberWaitlistDe: Story = () => (
  <EventCard
    event={sampleEventSoldOut}
    locale="de"
    viewer={{ kind: "member", subscriptionActive: true }}
  />
);
MemberWaitlistDe.storyName = "EventCard / Member — Warteliste (de)";

export const MemberInactiveDiscover: Story = () => (
  <EventCard
    event={sampleEventAvailable}
    locale="en"
    viewer={{ kind: "member", subscriptionActive: false }}
  />
);
MemberInactiveDiscover.storyName = "EventCard / Member inactive — Discover (no date/credits)";

export const MemberInactiveDiscoverDe: Story = () => (
  <EventCard
    event={sampleEventAvailable}
    locale="de"
    viewer={{ kind: "member", subscriptionActive: false }}
  />
);
MemberInactiveDiscoverDe.storyName = "EventCard / Member inactive — Entdecken (de)";

export const MemberDiscover: Story = () => (
  <EventCard
    event={sampleEventAvailable}
    locale="en"
    viewer={{ kind: "member", subscriptionActive: true }}
  />
);
MemberDiscover.storyName = "EventCard / Member — Discover";

export const MemberDiscoverDe: Story = () => (
  <EventCard
    event={sampleEventAvailable}
    locale="de"
    viewer={{ kind: "member", subscriptionActive: true }}
  />
);
MemberDiscoverDe.storyName = "EventCard / Member — Entdecken (de)";

export const MemberSavedOn: Story = () => (
  <EventCard
    bookmarkFormAction="/en/events/sample/unsave"
    bookmarkReturnTo="/en/events"
    event={sampleEventAvailable}
    locale="en"
    viewer={{ kind: "member", saved: true, subscriptionActive: true }}
  />
);
MemberSavedOn.storyName = "EventCard / Member — Saved on (form)";

export const MemberSavedOff: Story = () => (
  <EventCard
    bookmarkFormAction="/en/events/sample/save"
    bookmarkReturnTo="/en/events"
    event={sampleEventAvailable}
    locale="en"
    viewer={{ kind: "member", saved: false, subscriptionActive: true }}
  />
);
MemberSavedOff.storyName = "EventCard / Member — Saved off (form)";

export const MemberSavedOnDe: Story = () => (
  <EventCard
    bookmarkFormAction="/de/events/sample/unsave"
    bookmarkReturnTo="/de/saved"
    event={sampleEventAvailable}
    locale="de"
    viewer={{ kind: "member", saved: true, subscriptionActive: true }}
  />
);
MemberSavedOnDe.storyName = "EventCard / Member — Gemerkt (de form)";
