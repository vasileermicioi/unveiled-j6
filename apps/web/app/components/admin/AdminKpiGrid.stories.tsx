import type { Story } from "@ladle/react";
import { mockAdminMetrics, storyLocale } from "../stories/fixtures";
import { AdminKpiGrid } from "./AdminKpiGrid";

export const Default: Story = () => (
  <AdminKpiGrid locale={storyLocale} metrics={mockAdminMetrics} />
);
Default.storyName = "AdminKpiGrid / Default";
