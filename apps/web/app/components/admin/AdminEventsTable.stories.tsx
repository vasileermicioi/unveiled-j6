import type { Story } from "@ladle/react";
import {
  mockEvent,
  mockEventImageUrls,
  storyLocale,
} from "../stories/fixtures";
import { AdminEventsTable } from "./AdminEventsTable";

export const WithRows: Story = () => (
  <AdminEventsTable
    events={[mockEvent]}
    imageUrls={mockEventImageUrls}
    listPath="/de/admin/events"
    locale={storyLocale}
    query={{ q: "" }}
  />
);
WithRows.storyName = "AdminEventsTable / With rows";

export const Empty: Story = () => (
  <AdminEventsTable
    events={[]}
    imageUrls={{}}
    listPath="/de/admin/events"
    locale={storyLocale}
    query={{ q: "" }}
  />
);
Empty.storyName = "AdminEventsTable / Empty";
