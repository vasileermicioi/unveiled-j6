import type { Story } from "@ladle/react";
import { mockEvent, mockEventImageUrls, storyLocale } from "../stories/fixtures";
import { AdminEventsTable } from "./AdminEventsTable";

export const WithRows: Story = () => (
  <AdminEventsTable events={[mockEvent]} imageUrls={mockEventImageUrls} locale={storyLocale} />
);
WithRows.storyName = "AdminEventsTable / With rows";

export const Empty: Story = () => (
  <AdminEventsTable events={[]} imageUrls={{}} locale={storyLocale} />
);
Empty.storyName = "AdminEventsTable / Empty";
