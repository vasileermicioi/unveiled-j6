import type { Story } from "@ladle/react";

import { mockAdminListQuery, mockMemberListItem, storyLocale } from "../stories/fixtures";
import { AdminUsersListPage } from "./AdminUsersListPage";

export const Default: Story = () => (
  <AdminUsersListPage
    locale={storyLocale}
    members={[mockMemberListItem]}
    query={mockAdminListQuery}
    total={1}
  />
);
Default.storyName = "AdminUsersListPage / Default";

export const Empty: Story = () => (
  <AdminUsersListPage locale={storyLocale} members={[]} query={mockAdminListQuery} total={0} />
);
Empty.storyName = "AdminUsersListPage / Empty";
