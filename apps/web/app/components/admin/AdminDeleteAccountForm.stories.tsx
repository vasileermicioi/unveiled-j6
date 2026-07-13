import type { Story } from "@ladle/react";

import { mockMemberId, storyLocale } from "../stories/fixtures";
import { AdminDeleteAccountForm } from "./AdminDeleteAccountForm";

const base = {
  locale: storyLocale,
  userId: mockMemberId,
  memberLabel: "Alex Berlin",
  action: "#",
} as const;

export const Confirm: Story = () => <AdminDeleteAccountForm {...base} />;
Confirm.storyName = "AdminDeleteAccountForm / Confirm";

export const WithError: Story = () => (
  <AdminDeleteAccountForm {...base} error="Account deletion failed. Please try again." />
);
WithError.storyName = "AdminDeleteAccountForm / With error";
