import type { Story } from "@ladle/react";

import type { EventFeedQuery } from "../../lib/event-feed";

import { EventFeedFilters } from "./EventFeedFilters";

const categoryOptionsEn = [
  { id: "theater", label: "Theater" },
  { id: "live_music_venue", label: "Live music venue" },
  { id: "exhibition_hall", label: "Exhibition hall" },
];

const categoryOptionsDe = [
  { id: "theater", label: "Theater" },
  { id: "live_music_venue", label: "Live-Musik-Venue" },
  { id: "exhibition_hall", label: "Ausstellungshalle" },
];

const partnerOptions = [
  { id: "partner-volks", label: "Volksbühne Berlin" },
  { id: "partner-gropius", label: "Gropius Bau" },
];

const minDate = "2026-08-03";

const defaultQuery: EventFeedQuery = {
  title: undefined,
  category: undefined,
  partnerId: undefined,
  from: undefined,
  to: undefined,
  page: 1,
};

const filteredQuery: EventFeedQuery = {
  title: undefined,
  category: "theater",
  partnerId: "partner-volks",
  from: "2026-08-10",
  to: "2026-08-20",
  page: 1,
};

const titleFilteredQuery: EventFeedQuery = {
  title: "Jazz",
  category: undefined,
  partnerId: undefined,
  from: undefined,
  to: undefined,
  page: 1,
};

export const DefaultUpcomingScope: Story = () => (
  <EventFeedFilters
    action="/en/events"
    categoryOptions={categoryOptionsEn}
    locale="en"
    minDate={minDate}
    partnerOptions={partnerOptions}
    query={defaultQuery}
  />
);
DefaultUpcomingScope.storyName = "EventFeedFilters / Default — upcoming scope";

export const FiltersApplied: Story = () => (
  <EventFeedFilters
    action="/en/events"
    categoryOptions={categoryOptionsEn}
    locale="en"
    minDate={minDate}
    partnerOptions={partnerOptions}
    query={filteredQuery}
  />
);
FiltersApplied.storyName = "EventFeedFilters / Filters applied";

export const TitleFilterApplied: Story = () => (
  <EventFeedFilters
    action="/en/events"
    categoryOptions={categoryOptionsEn}
    locale="en"
    minDate={minDate}
    partnerOptions={partnerOptions}
    query={titleFilteredQuery}
  />
);
TitleFilterApplied.storyName = "EventFeedFilters / Title filter applied";

export const DefaultUpcomingScopeDe: Story = () => (
  <EventFeedFilters
    action="/de/events"
    categoryOptions={categoryOptionsDe}
    locale="de"
    minDate={minDate}
    partnerOptions={partnerOptions}
    query={defaultQuery}
  />
);
DefaultUpcomingScopeDe.storyName = "EventFeedFilters / Default — upcoming scope (de)";
