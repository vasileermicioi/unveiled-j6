import type { Story } from "@ladle/react";

import { mockMemberId, storyLocale } from "../stories/fixtures";
import { AdminFreezeForm } from "./AdminFreezeForm";

const base = {
  locale: storyLocale,
  userId: mockMemberId,
  memberLabel: "Alex Berlin",
  action: "#",
} as const;

export const Freeze: Story = () => <AdminFreezeForm {...base} freezeAction="freeze" />;
Freeze.storyName = "AdminFreezeForm / Freeze";

export const Unfreeze: Story = () => <AdminFreezeForm {...base} freezeAction="unfreeze" />;
Unfreeze.storyName = "AdminFreezeForm / Unfreeze";

export const Unavailable: Story = () => <AdminFreezeForm {...base} freezeAction="unavailable" />;
Unavailable.storyName = "AdminFreezeForm / Unavailable";
