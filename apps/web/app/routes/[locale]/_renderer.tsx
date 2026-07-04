import { reactRenderer } from "@hono/react-renderer";

import { AppShell } from "../../components/AppShell";
import type { Locale } from "../../lib/locale";
import { isValidLocale } from "../../lib/locale";

function getLocaleParam(value: string | undefined): Locale {
  return value && isValidLocale(value) ? value : "de";
}

export default reactRenderer(({ children, Layout, c, title, locale, robots }) => {
  const resolvedLocale = getLocaleParam(locale ?? c.req.param("locale"));
  const pathname = new URL(c.req.url).pathname;

  return (
    <Layout locale={resolvedLocale} robots={robots} title={title}>
      <AppShell locale={resolvedLocale} pathname={pathname}>
        {children}
      </AppShell>
    </Layout>
  );
});
