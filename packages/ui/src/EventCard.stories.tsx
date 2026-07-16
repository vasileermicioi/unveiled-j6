import type { Story } from "@ladle/react";

import { EventCard } from "./EventCard";
import { sampleEventAvailable, sampleEventSoldOut } from "./stories/event-fixtures";

export const HoverAvailabilityVisible: Story = () => (
  <EventCard
    className="event-card--availability-visible"
    event={sampleEventAvailable}
    locale="en"
    viewer={{ kind: "member", subscriptionActive: true }}
  />
);
HoverAvailabilityVisible.storyName = "EventCard / Hover — availability visible";

export const GuestSeeDetails: Story = () => (
  <EventCard event={sampleEventSoldOut} locale="en" viewer={{ kind: "guest" }} />
);
GuestSeeDetails.storyName = "EventCard / Guest — See details";

export const GuestSeeDetailsDe: Story = () => (
  <EventCard event={sampleEventSoldOut} locale="de" viewer={{ kind: "guest" }} />
);
GuestSeeDetailsDe.storyName = "EventCard / Guest — Mehr sehen (de)";

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

export const MemberUnlock: Story = () => (
  <EventCard
    event={sampleEventAvailable}
    locale="en"
    viewer={{ kind: "member", subscriptionActive: false }}
  />
);
MemberUnlock.storyName = "EventCard / Member — Unlock event";

export const MemberUnlockDe: Story = () => (
  <EventCard
    event={sampleEventAvailable}
    locale="de"
    viewer={{ kind: "member", subscriptionActive: false }}
  />
);
MemberUnlockDe.storyName = "EventCard / Member — Mit Abo öffnen (de)";

export const MemberBookNow: Story = () => (
  <EventCard
    event={sampleEventAvailable}
    locale="en"
    viewer={{ kind: "member", subscriptionActive: true }}
  />
);
MemberBookNow.storyName = "EventCard / Member — Book Now";

export const MemberBookNowDe: Story = () => (
  <EventCard
    event={sampleEventAvailable}
    locale="de"
    viewer={{ kind: "member", subscriptionActive: true }}
  />
);
MemberBookNowDe.storyName = "EventCard / Member — Bin dabei (de)";

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
