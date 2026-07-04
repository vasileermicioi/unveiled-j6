import "@hono/react-renderer";

import type { Locale } from "../lib/locale";

declare module "@hono/react-renderer" {
  interface Props {
    title?: string;
    locale?: Locale;
    robots?: string;
  }
}
