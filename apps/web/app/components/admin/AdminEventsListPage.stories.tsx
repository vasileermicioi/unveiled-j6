import type { Story } from "@ladle/react";
import {
  mockAdminListQuery,
  mockEvent,
  mockEventImageUrls,
  storyLocale,
} from "../stories/fixtures";
import { AdminEventsListPage } from "./AdminEventsListPage";

export const Default: Story = () => (
  <AdminEventsListPage
    events={[mockEvent]}
    imageUrls={mockEventImageUrls}
    locale={storyLocale}
    query={mockAdminListQuery}
    total={1}
  />
);
Default.storyName = "AdminEventsListPage / Default";
