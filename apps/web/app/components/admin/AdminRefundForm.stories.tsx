import type { Story } from "@ladle/react";

import { mockMemberId, storyLocale } from "../stories/fixtures";
import { AdminRefundForm } from "./AdminRefundForm";

const base = {
  locale: storyLocale,
  userId: mockMemberId,
  memberLabel: "Alex Berlin",
  action: "#",
} as const;

export const Default: Story = () => <AdminRefundForm {...base} />;
Default.storyName = "AdminRefundForm / Default";

export const WithError: Story = () => (
  <AdminRefundForm {...base} defaultAmount="-1" error="Ungültiger Betrag." />
);
WithError.storyName = "AdminRefundForm / With error";
