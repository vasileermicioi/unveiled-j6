import type { Story } from "@ladle/react";

import type { EventFeedQuery } from "../../lib/event-feed";
import { mockEventCardItem } from "../stories/fixtures";

import { EventFeedPage } from "./EventFeedPage";

const categoryOptions = [
  { id: "Theater", label: "Theater" },
  { id: "Konzert", label: "Konzert" },
];

const partnerOptions = [
  { id: "partner-lit", label: "Literaturhaus Berlin" },
  { id: "partner-volks", label: "Volksbühne Berlin" },
];

const emptyQuery: EventFeedQuery = {
  category: "Kino",
  partnerId: undefined,
  from: "2099-01-01",
  to: "2099-01-02",
  page: 1,
};

const populatedQuery: EventFeedQuery = {
  category: undefined,
  partnerId: undefined,
  from: undefined,
  to: undefined,
  page: 1,
};

export const EmptyNoResults: Story = () => (
  <EventFeedPage
    categoryOptions={categoryOptions}
    events={[]}
    locale="en"
    partnerOptions={partnerOptions}
    query={emptyQuery}
    savedEventIds={new Set()}
    subscriptionActive={false}
    total={0}
  />
);
EmptyNoResults.storyName = "EventFeedPage / Empty — no results";

export const PopulatedInactiveSub: Story = () => (
  <EventFeedPage
    categoryOptions={categoryOptions}
    events={[mockEventCardItem]}
    locale="en"
    partnerOptions={partnerOptions}
    query={populatedQuery}
    savedEventIds={new Set()}
    subscriptionActive={false}
    total={1}
  />
);
PopulatedInactiveSub.storyName = "EventFeedPage / Populated — inactive subscription";

export const EmptyNoResultsDe: Story = () => (
  <EventFeedPage
    categoryOptions={categoryOptions}
    events={[]}
    locale="de"
    partnerOptions={partnerOptions}
    query={emptyQuery}
    savedEventIds={new Set()}
    subscriptionActive
    total={0}
  />
);
EmptyNoResultsDe.storyName = "EventFeedPage / Empty — no results (de)";
