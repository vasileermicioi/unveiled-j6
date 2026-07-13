import type { Context, ErrorHandler } from "hono";

import { ForbiddenPage } from "../components/ForbiddenPage";
import { ServerErrorPage } from "../components/ServerErrorPage";
import { getRequestLocale, type Locale } from "./locale";
import { captureServerException } from "./sentry";

function errorPageTitle(locale: Locale): string {
  return locale === "de" ? "Fehler — Unveiled Berlin" : "Error — Unveiled Berlin";
}

function forbiddenPageTitle(locale: Locale): string {
  return locale === "de" ? "Zugriff verweigert — Unveiled Berlin" : "Forbidden — Unveiled Berlin";
}

/** Branded 403 HTML — use for true forbidden cases; prefer redirect/404 for wrong-role admin. */
export function renderForbiddenPage(c: Context) {
  const locale = getRequestLocale(c);
  c.status(403);
  c.header("X-Robots-Tag", "noindex");

  return c.render(<ForbiddenPage locale={locale} />, {
    locale,
    robots: "noindex",
    title: forbiddenPageTitle(locale),
  });
}

export function renderServerErrorPage(c: Context, locale?: Locale) {
  const resolved = locale ?? getRequestLocale(c);
  c.status(500);
  c.header("X-Robots-Tag", "noindex");

  return c.render(<ServerErrorPage locale={resolved} />, {
    locale: resolved,
    robots: "noindex",
    title: errorPageTitle(resolved),
  });
}

/** HonoX `_error.tsx` handlers — never expose stack traces or exception messages. */
export const serverErrorHandler: ErrorHandler = (err, c) => {
  console.error(err);
  captureServerException(err);
  return renderServerErrorPage(c);
};

/**
 * Outer-app catch-all (auth proxy, webhooks, smoke routes).
 * Branded HTML 500s are handled by HonoX `_error.tsx` inside `createApp()`.
 */
export async function outerAppErrorHandler(err: Error, c: Context): Promise<Response> {
  console.error(err);
  captureServerException(err);

  const pathname = new URL(c.req.url).pathname;
  if (pathname.startsWith("/api/")) {
    return c.json({ error: "Internal Server Error" }, 500);
  }

  return new Response("Internal Server Error", {
    status: 500,
    headers: { "content-type": "text/plain; charset=utf-8", "x-robots-tag": "noindex" },
  });
}
