import { reactRenderer } from "@hono/react-renderer";

import { AppShell } from "../../components/AppShell";
import type { Locale } from "../../lib/locale";
import { isValidLocale } from "../../lib/locale";

function getLocaleParam(value: string | undefined): Locale {
  return value && isValidLocale(value) ? value : "de";
}

export default reactRenderer(
  ({ children, Layout, c, title, locale, robots, description, canonicalPath, ogImage }) => {
    const resolvedLocale = getLocaleParam(locale ?? c.req.param("locale"));
    const pathname = new URL(c.req.url).pathname;
    const session = c.get("session") ?? null;
    const savedCount = c.get("savedCount") ?? 0;
    const canBrowseEvents = c.get("canBrowseEvents") ?? false;

    return (
      <Layout
        canonicalPath={canonicalPath ?? pathname}
        description={description}
        locale={resolvedLocale}
        ogImage={ogImage}
        robots={robots}
        title={title}
      >
        <AppShell
          canBrowseEvents={canBrowseEvents}
          locale={resolvedLocale}
          pathname={pathname}
          savedCount={savedCount}
          session={session}
        >
          {children}
        </AppShell>
      </Layout>
    );
  },
);
