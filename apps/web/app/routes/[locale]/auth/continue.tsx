import type { Context } from "hono";
import { createRoute } from "honox/factory";

import { getSessionIfConfigured } from "../../../lib/auth";
import { buildLoginRedirectUrl } from "../../../lib/auth-middleware";
import type { Locale } from "../../../lib/locale";
import { isValidLocale } from "../../../lib/locale";
import { parseReturnTo, resolvePostAuthRedirect } from "../../../lib/post-auth-redirect";

function getLocaleParam(value: string | undefined): Locale {
  return value && isValidLocale(value) ? value : "de";
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Neon Auth session cookies are sometimes not readable on the first SSR hit right after
 * client sign-in (see e2e/fixtures/auth.ts). Retry briefly before bouncing to login.
 */
async function resolveSessionWithRetry(c: Context) {
  const hasCookie = Boolean(c.req.header("cookie")?.trim());
  const attempts = hasCookie ? 3 : 1;

  for (let attempt = 0; attempt < attempts; attempt++) {
    const session = await getSessionIfConfigured(c);
    if (session) {
      return session;
    }
    if (attempt < attempts - 1) {
      await sleep(150 * (attempt + 1));
    }
  }

  return null;
}

export default createRoute(async (c) => {
  const locale = getLocaleParam(c.req.param("locale"));
  const session = await resolveSessionWithRetry(c);
  const returnTo = parseReturnTo(c.req.query("returnTo"), locale);

  if (!session) {
    // Destination path only — never `/auth/continue` itself (nests returnTo / loops).
    return c.redirect(buildLoginRedirectUrl(locale, returnTo ?? `/${locale}`), 302);
  }

  const destination = resolvePostAuthRedirect({
    locale,
    session,
    returnTo,
  });

  return c.redirect(destination, 302);
});
