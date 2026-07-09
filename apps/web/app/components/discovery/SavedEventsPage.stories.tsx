import type { Story } from "@ladle/react";

import { mockEventCardItem } from "../stories/fixtures";

import { SavedEventsPage } from "./SavedEventsPage";

export const Empty: Story = () => (
  <SavedEventsPage events={[]} locale="en" subscriptionActive={false} />
);
Empty.storyName = "SavedEventsPage / Empty";

export const Populated: Story = () => (
  <SavedEventsPage events={[mockEventCardItem]} locale="en" subscriptionActive />
);
Populated.storyName = "SavedEventsPage / Populated";

export const EmptyDe: Story = () => (
  <SavedEventsPage events={[]} locale="de" subscriptionActive={false} />
);
EmptyDe.storyName = "SavedEventsPage / Empty (de)";
