import "@hono/react-renderer";

import type { AppSession } from "../lib/auth";
import type { Locale } from "../lib/locale";

declare global {
  const process: {
    env: {
      SITE_URL?: string;
      DATABASE_URL?: string;
      AUTH_URL?: string;
      S3_ENDPOINT?: string;
      S3_REGION?: string;
      S3_BUCKET?: string;
      S3_ACCESS_KEY_ID?: string;
      S3_SECRET_ACCESS_KEY?: string;
      IMAGE_PUBLIC_BASE_URL?: string;
    };
  };
}

declare module "hono" {
  interface ContextVariableMap {
    session: AppSession | null;
    savedCount: number;
  }
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
