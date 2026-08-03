import type { Story } from "@ladle/react";
import {
  mockAdminEventsListQuery,
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
    query={mockAdminEventsListQuery}
    total={1}
  />
);
Default.storyName = "AdminEventsListPage / Default";
