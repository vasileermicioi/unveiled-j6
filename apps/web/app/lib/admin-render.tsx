import type { Context } from "hono";
import type { ReactElement } from "react";

import { AdminLayout } from "../components/admin/AdminLayout";
import { inferAdminTab } from "../components/admin/admin-tabs";
import type { Locale } from "./locale";

type AdminRenderOptions = {
  locale: Locale;
  title: string;
  subtitle?: string;
  canonicalPath?: string;
};

export function renderAdminPage(c: Context, children: ReactElement, options: AdminRenderOptions) {
  const pathname = options.canonicalPath ?? new URL(c.req.url).pathname;

  return c.render(
    <AdminLayout activeTab={inferAdminTab(pathname)} locale={options.locale}>
      {children}
    </AdminLayout>,
    {
      locale: options.locale,
      title: `${options.title} — Unveiled Berlin`,
      description: options.subtitle,
      canonicalPath: pathname,
      robots: "noindex",
    },
  );
}
