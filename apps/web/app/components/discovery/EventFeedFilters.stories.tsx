import type { Story } from "@ladle/react";

import type { EventFeedQuery } from "../../lib/event-feed";

import { EventFeedFilters } from "./EventFeedFilters";

const categoryOptions = [
  { id: "Theater", label: "Theater" },
  { id: "Konzert", label: "Konzert" },
  { id: "Ausstellung", label: "Ausstellung" },
];

const partnerOptions = [
  { id: "partner-volks", label: "Volksbühne Berlin" },
  { id: "partner-gropius", label: "Gropius Bau" },
];

const defaultQuery: EventFeedQuery = {
  category: undefined,
  partnerId: undefined,
  from: undefined,
  to: undefined,
  page: 1,
};

const filteredQuery: EventFeedQuery = {
  category: "Theater",
  partnerId: "partner-volks",
  from: "2026-07-10",
  to: "2026-07-20",
  page: 1,
};

export const DefaultUpcomingScope: Story = () => (
  <EventFeedFilters
    action="/en/events"
    categoryOptions={categoryOptions}
    locale="en"
    partnerOptions={partnerOptions}
    query={defaultQuery}
  />
);
DefaultUpcomingScope.storyName = "EventFeedFilters / Default — upcoming scope";

export const FiltersApplied: Story = () => (
  <EventFeedFilters
    action="/en/events"
    categoryOptions={categoryOptions}
    locale="en"
    partnerOptions={partnerOptions}
    query={filteredQuery}
  />
);
FiltersApplied.storyName = "EventFeedFilters / Filters applied";

export const DefaultUpcomingScopeDe: Story = () => (
  <EventFeedFilters
    action="/de/events"
    categoryOptions={categoryOptions}
    locale="de"
    partnerOptions={partnerOptions}
    query={defaultQuery}
  />
);
DefaultUpcomingScopeDe.storyName = "EventFeedFilters / Default — upcoming scope (de)";
