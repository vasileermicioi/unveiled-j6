import type { Story } from "@ladle/react";
import { storyLocale } from "../stories/fixtures";
import { AdminSearchForm } from "./AdminSearchForm";

export const Empty: Story = () => (
  <AdminSearchForm action="/de/admin/events" locale={storyLocale} />
);
Empty.storyName = "AdminSearchForm / Empty";

export const WithQuery: Story = () => (
  <AdminSearchForm action="/de/admin/events" defaultQuery="jazz" locale={storyLocale} />
);
WithQuery.storyName = "AdminSearchForm / With query";
