import { Paragraph } from "@heroui/react";
import type { Story } from "@ladle/react";
import { storyLocale } from "../stories/fixtures";
import { AdminLayout } from "./AdminLayout";

export const Overview: Story = () => (
  <AdminLayout activeTab="overview" locale={storyLocale}>
    <Paragraph color="muted">Admin overview content</Paragraph>
  </AdminLayout>
);
Overview.storyName = "AdminLayout / Overview";

export const Events: Story = () => (
  <AdminLayout activeTab="events" locale={storyLocale}>
    <Paragraph color="muted">Admin events content</Paragraph>
  </AdminLayout>
);
Events.storyName = "AdminLayout / Events";
