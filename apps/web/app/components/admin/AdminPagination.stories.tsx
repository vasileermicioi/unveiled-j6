import type { Story } from "@ladle/react";
import { storyLocale } from "../stories/fixtures";
import { AdminPagination } from "./AdminPagination";

const basePath = "/de/admin/events";

export const FirstPage: Story = () => (
  <AdminPagination
    basePath={basePath}
    locale={storyLocale}
    page={1}
    pageSize={10}
    queryString=""
    total={42}
  />
);
FirstPage.storyName = "AdminPagination / First page";

export const MiddlePage: Story = () => (
  <AdminPagination
    basePath={basePath}
    locale={storyLocale}
    page={3}
    pageSize={10}
    queryString="?page=3"
    total={42}
  />
);
MiddlePage.storyName = "AdminPagination / Middle page";

export const LastPage: Story = () => (
  <AdminPagination
    basePath={basePath}
    locale={storyLocale}
    page={5}
    pageSize={10}
    queryString="?page=5"
    total={42}
  />
);
LastPage.storyName = "AdminPagination / Last page";
