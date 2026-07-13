import type { Story } from "@ladle/react";

import { mockWaitlistEntry, storyLocale } from "../stories/fixtures";
import { AdminWaitlistListPage } from "./AdminWaitlistListPage";

export const Default: Story = () => (
  <AdminWaitlistListPage
    entries={[mockWaitlistEntry]}
    locale={storyLocale}
    page={1}
    pageSize={20}
    queryString=""
    total={1}
  />
);
Default.storyName = "AdminWaitlistListPage / Default";

export const Empty: Story = () => (
  <AdminWaitlistListPage
    entries={[]}
    locale={storyLocale}
    page={1}
    pageSize={20}
    queryString=""
    total={0}
  />
);
Empty.storyName = "AdminWaitlistListPage / Empty";
