import type { Story } from "@ladle/react";

import { mockMemberDetail, storyLocale } from "../stories/fixtures";
import { AdminUserDetailPage } from "./AdminUserDetailPage";

export const Default: Story = () => (
  <AdminUserDetailPage detail={mockMemberDetail} locale={storyLocale} />
);
Default.storyName = "AdminUserDetailPage / Default";

export const Sparse: Story = () => (
  <AdminUserDetailPage
    detail={{
      ...mockMemberDetail,
      user: {
        ...mockMemberDetail.user,
        profile: {},
        behavior: {},
      },
      subscription: null,
      counts: {
        bookings: 0,
        waitlistEntries: 0,
        savedEvents: 0,
      },
    }}
    locale={storyLocale}
  />
);
Sparse.storyName = "AdminUserDetailPage / Sparse";
