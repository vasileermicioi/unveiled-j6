import type { Story } from "@ladle/react";
import type { OpeningHoursWeek } from "@unveiled/db";

import type { PublicEventGalleryImage } from "../../lib/public-event-gallery";
import {
  mockEvent,
  mockImageId,
  mockPartner,
  mockSoldOutEvent,
  storyLocale,
} from "../stories/fixtures";
import { EventDetailPage } from "./EventDetailPage";

/**
 * Wide frame so lg identity/checkout alignment is reviewable.
 * Primary hero uses theme classes only (full-width band, centered, non-stretch).
 */
const wideMeta = { width: 1280 as const };

const storyOpeningHours: OpeningHoursWeek = {
  mon: { open: "10:00", close: "18:00" },
  tue: { open: "10:00", close: "18:00" },
  wed: { closed: true },
  thu: { open: "12:00", close: "20:00" },
  fri: { open: "10:00", close: "22:00" },
  sat: { open: "11:00", close: "16:00" },
  sun: { closed: true },
};

const storyPartnerAttribution = {
  name: mockPartner.name,
  logoUrl: `https://cdn.example.com/images/${mockPartner.logoImageId}/medium-640.webp`,
};

const storyPartnerAttributionWithHours = {
  ...storyPartnerAttribution,
  hasOpeningHours: true,
  openingHours: storyOpeningHours,
};

const storyGalleryImages: PublicEventGalleryImage[] = [
  {
    imageId: mockImageId,
    sortOrder: 0,
    thumbSrc: `https://cdn.example.com/images/${mockImageId}/medium-640.webp`,
    thumbSrcSet: `https://cdn.example.com/images/${mockImageId}/small-320.webp 320w, https://cdn.example.com/images/${mockImageId}/medium-640.webp 640w`,
    fullSrc: `https://cdn.example.com/images/${mockImageId}/large-1280.webp`,
    fullSrcSet: `https://cdn.example.com/images/${mockImageId}/medium-640.webp 640w, https://cdn.example.com/images/${mockImageId}/large-1280.webp 1280w`,
    credit: "Photo: Ada",
  },
  {
    imageId: "00000000-0000-4000-8000-0000000000aa",
    sortOrder: 1,
    thumbSrc: "https://cdn.example.com/images/00000000-0000-4000-8000-0000000000aa/medium-640.webp",
    thumbSrcSet:
      "https://cdn.example.com/images/00000000-0000-4000-8000-0000000000aa/small-320.webp 320w, https://cdn.example.com/images/00000000-0000-4000-8000-0000000000aa/medium-640.webp 640w",
    fullSrc: "https://cdn.example.com/images/00000000-0000-4000-8000-0000000000aa/large-1280.webp",
    fullSrcSet:
      "https://cdn.example.com/images/00000000-0000-4000-8000-0000000000aa/medium-640.webp 640w, https://cdn.example.com/images/00000000-0000-4000-8000-0000000000aa/large-1280.webp 1280w",
    credit: null,
  },
];

/** Guest: no tickets/credits/date chrome; unlock CTA remains; partner logo+name in DETAILS. */
export const Guest: Story = () => (
  <EventDetailPage
    closeHref={`/${storyLocale}`}
    event={mockEvent}
    locale={storyLocale}
    maxQty={1}
    partnerAttribution={storyPartnerAttribution}
    viewer={{ kind: "guest" }}
  />
);
Guest.storyName = "EventDetailPage / Guest";
Guest.meta = wideMeta;

/** Admin preview: guest chrome, inert CTA (no book/login/waitlist). */
export const PreviewGuest: Story = () => (
  <EventDetailPage
    closeHref={`/${storyLocale}/admin/events`}
    event={mockEvent}
    locale={storyLocale}
    maxQty={1}
    partnerAttribution={storyPartnerAttribution}
    preview={{
      primaryHref: `/${storyLocale}/admin/events/${mockEvent.id}/preview`,
      primaryLabel: "Preview only",
    }}
    viewer={{ kind: "guest" }}
  />
);
PreviewGuest.storyName = "EventDetailPage / Preview guest";
PreviewGuest.meta = wideMeta;

/** Eligible member: credit total + date visible; no quantity stepper (one ticket). */
export const Eligible: Story = () => (
  <EventDetailPage
    closeHref={`/${storyLocale}/events`}
    event={mockEvent}
    locale={storyLocale}
    maxQty={1}
    occurrences={[
      {
        startsAtIso: mockEvent.dateTimes[0]?.toISOString() ?? mockEvent.dateTime.toISOString(),
        creditPrice: 1,
        maxQty: 1,
      },
      {
        startsAtIso: mockEvent.dateTimes[1]?.toISOString() ?? mockEvent.dateTime.toISOString(),
        creditPrice: 4,
        maxQty: 0,
      },
    ]}
    partnerAttribution={storyPartnerAttribution}
    viewer={{ kind: "eligible" }}
  />
);
Eligible.storyName = "EventDetailPage / Eligible";
Eligible.meta = wideMeta;

const alreadyBookedMorning = new Date("2030-09-01T08:00:00.000Z");
const alreadyBookedEvening = new Date("2030-09-01T17:00:00.000Z");
const alreadyBookedEvent = {
  ...mockEvent,
  dateTime: alreadyBookedMorning,
  dateTimes: [alreadyBookedMorning, alreadyBookedEvening],
  occurrenceCreditPrices: [1, 4],
};

/** Eligible member: morning already booked; evening stays bookable via datetime select. */
export const AlreadyBookedHour: Story = () => (
  <EventDetailPage
    bookedOccurrenceIsos={[alreadyBookedMorning.toISOString()]}
    closeHref={`/${storyLocale}/events`}
    defaultDateTimeIso={alreadyBookedMorning.toISOString()}
    event={alreadyBookedEvent}
    locale={storyLocale}
    maxQty={1}
    occurrences={[
      {
        startsAtIso: alreadyBookedMorning.toISOString(),
        creditPrice: 1,
        maxQty: 1,
      },
      {
        startsAtIso: alreadyBookedEvening.toISOString(),
        creditPrice: 4,
        maxQty: 1,
      },
    ]}
    partnerAttribution={storyPartnerAttribution}
    viewer={{ kind: "eligible" }}
  />
);
AlreadyBookedHour.storyName = "EventDetailPage / Already booked hour";
AlreadyBookedHour.meta = wideMeta;

export const SoldOut: Story = () => (
  <EventDetailPage
    closeHref={`/${storyLocale}/events`}
    event={mockSoldOutEvent}
    locale={storyLocale}
    partnerAttribution={storyPartnerAttribution}
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
    partnerAttribution={storyPartnerAttribution}
    viewer={{ kind: "membership_required" }}
  />
);
MembershipRequired.storyName = "EventDetailPage / Membership required";
MembershipRequired.meta = wideMeta;

/** Past event + inactive member: membership CTA (no “already taken place”). */
export const MembershipRequiredPast: Story = () => (
  <EventDetailPage
    closeHref={`/${storyLocale}/discover`}
    event={{
      ...mockEvent,
      dateTime: new Date("2020-01-01T20:00:00+01:00"),
      dateTimes: [new Date("2020-01-01T20:00:00+01:00")],
    }}
    locale={storyLocale}
    partnerAttribution={storyPartnerAttribution}
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
    partnerAttribution={storyPartnerAttribution}
    viewer={{ kind: "past_due" }}
  />
);
PastDue.storyName = "EventDetailPage / Past due";
PastDue.meta = wideMeta;

/** Eligible member sees all datetimes listed (next upcoming emphasized). */
export const MultiDateTimesEligible: Story = () => (
  <EventDetailPage
    closeHref={`/${storyLocale}/events`}
    event={mockEvent}
    locale={storyLocale}
    maxQty={1}
    partnerAttribution={storyPartnerAttribution}
    viewer={{ kind: "eligible" }}
  />
);
MultiDateTimesEligible.storyName = "EventDetailPage / Multi datetimes (eligible)";
MultiDateTimesEligible.meta = wideMeta;

/** Name-only attribution when logo URL is absent. */
export const PartnerNameOnly: Story = () => (
  <EventDetailPage
    closeHref={`/${storyLocale}`}
    event={mockEvent}
    locale={storyLocale}
    maxQty={1}
    partnerAttribution={{ name: mockPartner.name }}
    viewer={{ kind: "guest" }}
  />
);
PartnerNameOnly.storyName = "EventDetailPage / Partner name only";
PartnerNameOnly.meta = wideMeta;

/**
 * DETAILS partner attribution with weekly opening hours (guest).
 * Fixture still includes closed Wed/Sun; display lists working days only.
 */
export const PartnerWithOpeningHours: Story = () => (
  <EventDetailPage
    closeHref={`/${storyLocale}`}
    event={mockEvent}
    locale={storyLocale}
    maxQty={1}
    partnerAttribution={storyPartnerAttributionWithHours}
    viewer={{ kind: "guest" }}
  />
);
PartnerWithOpeningHours.storyName = "EventDetailPage / Partner with opening hours";
PartnerWithOpeningHours.meta = wideMeta;

/** Eligible + hours: Date is date-only; two same-day slots collapse; checkout select keeps times. */
export const EligiblePartnerWithOpeningHours: Story = () => {
  const sameDayMorning = new Date("2026-08-15T19:00:00+02:00");
  const sameDayEvening = new Date("2026-08-15T21:00:00+02:00");
  const laterDay = new Date("2026-08-22T19:00:00+02:00");

  return (
    <EventDetailPage
      closeHref={`/${storyLocale}/events`}
      event={{
        ...mockEvent,
        dateTime: sameDayMorning,
        dateTimes: [sameDayMorning, sameDayEvening, laterDay],
        occurrenceCreditPrices: [2, 2, 2],
        occurrenceCapacities: [40, 40, 40],
      }}
      locale={storyLocale}
      maxQty={1}
      occurrences={[
        { startsAtIso: sameDayMorning.toISOString(), creditPrice: 2, maxQty: 1 },
        { startsAtIso: sameDayEvening.toISOString(), creditPrice: 2, maxQty: 1 },
        { startsAtIso: laterDay.toISOString(), creditPrice: 2, maxQty: 1 },
      ]}
      partnerAttribution={storyPartnerAttributionWithHours}
      viewer={{ kind: "eligible" }}
    />
  );
};
EligiblePartnerWithOpeningHours.storyName = "EventDetailPage / Eligible partner with opening hours";
EligiblePartnerWithOpeningHours.meta = wideMeta;

/** Empty gallery prop (default) — section omitted. */
export const WithoutGallery: Story = () => (
  <EventDetailPage
    closeHref={`/${storyLocale}`}
    event={mockEvent}
    galleryImages={[]}
    locale={storyLocale}
    maxQty={1}
    partnerAttribution={storyPartnerAttribution}
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
    heroCredit="Photo: Ada"
    locale={storyLocale}
    maxQty={1}
    partnerAttribution={{ ...storyPartnerAttribution, logoCredit: "Logo: Venue" }}
    viewer={{ kind: "guest" }}
  />
);
WithGallery.storyName = "EventDetailPage / With gallery";
WithGallery.meta = wideMeta;

/** Subtitles row in DETAILS when hasSubtitles is true. */
export const WithSubtitles: Story = () => (
  <EventDetailPage
    closeHref={`/${storyLocale}`}
    event={{ ...mockEvent, hasSubtitles: true, subtitleLanguages: ["DE", "EN"] }}
    locale={storyLocale}
    maxQty={1}
    partnerAttribution={storyPartnerAttribution}
    viewer={{ kind: "guest" }}
  />
);
WithSubtitles.storyName = "EventDetailPage / With subtitles";
WithSubtitles.meta = wideMeta;
