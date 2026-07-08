import type { Story } from "@ladle/react";
import { mockAdminMetrics, storyLocale } from "../stories/fixtures";
import { AdminDashboardPage } from "./AdminDashboardPage";

export const Default: Story = () => (
  <AdminDashboardPage locale={storyLocale} metrics={mockAdminMetrics} showSeedButton />
);
Default.storyName = "AdminDashboardPage / With seed button";

export const Seeded: Story = () => (
  <AdminDashboardPage
    locale={storyLocale}
    metrics={mockAdminMetrics}
    seedMessage="seeded"
    showSeedButton
  />
);
Seeded.storyName = "AdminDashboardPage / Seed success";
