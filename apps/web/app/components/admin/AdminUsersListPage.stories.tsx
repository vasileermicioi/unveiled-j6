import type { Story } from "@ladle/react";

import {
  mockAdminListQuery,
  mockAdminUsersListQuery,
  mockMemberListItem,
  mockMemberListItemNoSubscription,
  mockMemberListItemSecond,
  storyLocale,
} from "../stories/fixtures";
import { AdminUsersListPage } from "./AdminUsersListPage";

const mergedMembers = [
  mockMemberListItem,
  mockMemberListItemSecond,
  mockMemberListItemNoSubscription,
];

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

export const MergedMembers: Story = () => (
  <AdminUsersListPage
    locale={storyLocale}
    members={mergedMembers}
    query={mockAdminUsersListQuery}
    total={mergedMembers.length}
  />
);
MergedMembers.storyName = "AdminUsersListPage / Merged member cells";

export const MergedMembersEn: Story = () => (
  <AdminUsersListPage
    locale="en"
    members={mergedMembers}
    query={mockAdminUsersListQuery}
    total={mergedMembers.length}
  />
);
MergedMembersEn.storyName = "AdminUsersListPage / Merged member cells (en)";

export const CreatedDates: Story = () => (
  <AdminUsersListPage
    locale={storyLocale}
    members={mergedMembers}
    query={mockAdminUsersListQuery}
    total={mergedMembers.length}
  />
);
CreatedDates.storyName = "AdminUsersListPage / Created dates incl empty values";

export const CreatedDatesEn: Story = () => (
  <AdminUsersListPage
    locale="en"
    members={mergedMembers}
    query={mockAdminUsersListQuery}
    total={mergedMembers.length}
  />
);
CreatedDatesEn.storyName = "AdminUsersListPage / Created dates incl empty values (en)";

export const SortedByCreated: Story = () => (
  <AdminUsersListPage
    locale={storyLocale}
    members={mergedMembers}
    query={{ ...mockAdminUsersListQuery, sort: "created", dir: "desc" }}
    total={mergedMembers.length}
  />
);
SortedByCreated.storyName = "AdminUsersListPage / Sorted by Created desc";

export const SortedByCreatedEn: Story = () => (
  <AdminUsersListPage
    locale="en"
    members={mergedMembers}
    query={{ ...mockAdminUsersListQuery, sort: "created", dir: "desc" }}
    total={mergedMembers.length}
  />
);
SortedByCreatedEn.storyName = "AdminUsersListPage / Sorted by Created desc (en)";

export const SortedByMember: Story = () => (
  <AdminUsersListPage
    locale={storyLocale}
    members={mergedMembers}
    query={{ ...mockAdminUsersListQuery, sort: "member", dir: "asc" }}
    total={mergedMembers.length}
  />
);
SortedByMember.storyName = "AdminUsersListPage / Sorted by Member asc";

export const Filtered: Story = () => (
  <AdminUsersListPage
    locale={storyLocale}
    members={[mockMemberListItem]}
    query={{
      ...mockAdminUsersListQuery,
      q: "member",
      subscription: "ACTIVE",
      creditsMin: 10,
      createdFrom: "2026-08-01",
      createdTo: "2026-08-31",
    }}
    total={1}
  />
);
Filtered.storyName = "AdminUsersListPage / Filtered";

export const FilteredEn: Story = () => (
  <AdminUsersListPage
    locale="en"
    members={[mockMemberListItem]}
    query={{
      ...mockAdminUsersListQuery,
      q: "member",
      subscription: "ACTIVE",
      creditsMin: 10,
      createdFrom: "2026-08-01",
      createdTo: "2026-08-31",
    }}
    total={1}
  />
);
FilteredEn.storyName = "AdminUsersListPage / Filtered (en)";

export const FilteredEmpty: Story = () => (
  <AdminUsersListPage
    locale={storyLocale}
    members={[]}
    query={{
      ...mockAdminUsersListQuery,
      q: "no-such-member",
      subscription: "ACTIVE",
      creditsMin: 100,
    }}
    total={0}
  />
);
FilteredEmpty.storyName = "AdminUsersListPage / Filtered empty";

export const FilteredEmptyEn: Story = () => (
  <AdminUsersListPage
    locale="en"
    members={[]}
    query={{
      ...mockAdminUsersListQuery,
      q: "no-such-member",
      subscription: "ACTIVE",
      creditsMin: 100,
    }}
    total={0}
  />
);
FilteredEmptyEn.storyName = "AdminUsersListPage / Filtered empty (en)";
