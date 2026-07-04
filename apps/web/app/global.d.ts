import "@hono/react-renderer";

import type { Locale } from "../lib/locale";

declare global {
  const process: {
    env: {
      SITE_URL?: string;
    };
  };
}

declare module "@hono/react-renderer" {
  interface Props {
    title?: string;
    locale?: Locale;
    robots?: string;
    description?: string;
    canonicalPath?: string;
    ogImage?: string;
  }
}
