import type { Story } from "@ladle/react";

import { mockWaitlistEntry, storyLocale } from "../stories/fixtures";
import { AdminWaitlistPromotePage } from "./AdminWaitlistPromotePage";

export const Confirm: Story = () => (
  <AdminWaitlistPromotePage action="#" entry={mockWaitlistEntry} locale={storyLocale} />
);
Confirm.storyName = "AdminWaitlistPromotePage / Confirm";

export const WithError: Story = () => (
  <AdminWaitlistPromotePage
    action="#"
    entry={mockWaitlistEntry}
    error="Event ist ausverkauft."
    locale={storyLocale}
  />
);
WithError.storyName = "AdminWaitlistPromotePage / With error";
