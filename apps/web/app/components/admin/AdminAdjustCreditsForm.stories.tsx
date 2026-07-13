import type { Story } from "@ladle/react";

import { mockMemberId, storyLocale } from "../stories/fixtures";
import { AdminAdjustCreditsForm } from "./AdminAdjustCreditsForm";

const base = {
  locale: storyLocale,
  userId: mockMemberId,
  memberLabel: "Alex Berlin",
  action: "#",
} as const;

export const Default: Story = () => <AdminAdjustCreditsForm {...base} />;
Default.storyName = "AdminAdjustCreditsForm / Default";

export const WithError: Story = () => (
  <AdminAdjustCreditsForm {...base} defaultAmount="0" error="Betrag darf nicht null sein." />
);
WithError.storyName = "AdminAdjustCreditsForm / With error";
