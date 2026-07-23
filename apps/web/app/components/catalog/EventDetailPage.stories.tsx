import type { Story } from "@ladle/react";

import type { PublicEventGalleryImage } from "../../lib/public-event-gallery";
import { mockEvent, mockImageId, mockSoldOutEvent, storyLocale } from "../stories/fixtures";
import { EventDetailPage } from "./EventDetailPage";

/** Wide frame so lg two-column identity/checkout alignment and DETAILS grid are reviewable. */
const wideMeta = { width: 1280 as const };

const storyGalleryImages: PublicEventGalleryImage[] = [
  {
    imageId: mockImageId,
    sortOrder: 0,
    thumbSrc: `https://cdn.example.com/images/${mockImageId}/medium-640.jpg`,
    thumbSrcSet: `https://cdn.example.com/images/${mockImageId}/small-320.jpg 320w, https://cdn.example.com/images/${mockImageId}/medium-640.jpg 640w`,
    fullSrc: `https://cdn.example.com/images/${mockImageId}/large-1280.jpg`,
    fullSrcSet: `https://cdn.example.com/images/${mockImageId}/medium-640.jpg 640w, https://cdn.example.com/images/${mockImageId}/large-1280.jpg 1280w`,
  },
  {
    imageId: "00000000-0000-4000-8000-0000000000aa",
    sortOrder: 1,
    thumbSrc: "https://cdn.example.com/images/00000000-0000-4000-8000-0000000000aa/medium-640.jpg",
    thumbSrcSet:
      "https://cdn.example.com/images/00000000-0000-4000-8000-0000000000aa/small-320.jpg 320w, https://cdn.example.com/images/00000000-0000-4000-8000-0000000000aa/medium-640.jpg 640w",
    fullSrc: "https://cdn.example.com/images/00000000-0000-4000-8000-0000000000aa/large-1280.jpg",
    fullSrcSet:
      "https://cdn.example.com/images/00000000-0000-4000-8000-0000000000aa/medium-640.jpg 640w, https://cdn.example.com/images/00000000-0000-4000-8000-0000000000aa/large-1280.jpg 1280w",
  },
];

/** Guest: no tickets/credits/date chrome; unlock CTA remains. */
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

/** Past event + inactive member: membership CTA (no “already taken place”). */
export const MembershipRequiredPast: Story = () => (
  <EventDetailPage
    closeHref={`/${storyLocale}/discover`}
    event={{ ...mockEvent, dateTime: new Date("2020-01-01T20:00:00+01:00") }}
    locale={storyLocale}
    viewer={{ kind: "membership_required" }}
  />
);
MembershipRequiredPast.storyName = "EventDetailPage / Membership required (past)";
MembershipRequiredPast.meta = wideMeta;

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

/** Empty gallery prop (default) — section omitted. */
export const WithoutGallery: Story = () => (
  <EventDetailPage
    closeHref={`/${storyLocale}`}
    event={mockEvent}
    galleryImages={[]}
    locale={storyLocale}
    maxQty={3}
    viewer={{ kind: "guest" }}
  />
);
WithoutGallery.storyName = "EventDetailPage / Without gallery";
WithoutGallery.meta = wideMeta;

/** Populated gallery — section after DETAILS/LOCATION; thumbnails open slider. */
export const WithGallery: Story = () => (
  <EventDetailPage
    closeHref={`/${storyLocale}`}
    event={mockEvent}
    galleryImages={storyGalleryImages}
    locale={storyLocale}
    maxQty={3}
    viewer={{ kind: "guest" }}
  />
);
WithGallery.storyName = "EventDetailPage / With gallery";
WithGallery.meta = wideMeta;
