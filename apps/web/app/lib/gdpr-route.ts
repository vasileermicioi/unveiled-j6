import { cancelSubscriptionAtPeriodEnd, createStripeClient } from "@unveiled/billing";
import {
  anonymizeUserAccount,
  buildUserDataExport,
  createTxDb,
  isGdprError,
  type UserDataExport,
} from "@unveiled/db";
import type { Context } from "hono";

import { getAuthOptions } from "./auth";
import { createDisableAuthUser } from "./disable-auth-user";
import { getGdprMemberCopy, mapGdprErrorMessage } from "./gdpr-content";
import type { Locale } from "./locale";
import { guardProfileRoute } from "./profile-route";
import { resolveEnvVarFromContext } from "./runtime-env";

function requireAuthUrl(c: Context): string {
  const authUrl = resolveEnvVarFromContext(c, "AUTH_URL")?.replace(/\/$/, "");
  if (!authUrl) {
    throw new Error("AUTH_URL is not configured");
  }
  return authUrl;
}

function createCancelSubscriptionForDeletion(c: Context, databaseUrl: string) {
  return async (args: {
    userId: string;
    stripeSubscriptionId: string;
    stripeCustomerId: string | null;
  }) => {
    const secretKey = resolveEnvVarFromContext(c, "STRIPE_SECRET_KEY");
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    const stripe = createStripeClient(secretKey);
    const txDb = createTxDb(databaseUrl);
    try {
      await cancelSubscriptionAtPeriodEnd({
        stripe,
        stripeSubscriptionId: args.stripeSubscriptionId,
        stripeCustomerId: args.stripeCustomerId,
        db: txDb,
      });
    } finally {
      await txDb.pool.end().catch(() => undefined);
    }
  };
}

export async function buildExportDownloadResponse(userId: string): Promise<Response> {
  const { db } = getAuthOptions();
  const payload: UserDataExport = await buildUserDataExport(db, userId);
  const body = `${JSON.stringify(payload, null, 2)}\n`;
  return new Response(body, {
    status: 200,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "content-disposition": `attachment; filename="unveiled-data-export-${userId}.json"`,
      "cache-control": "no-store",
    },
  });
}

/**
 * Proxy Better Auth sign-out and return Set-Cookie headers to clear the session.
 */
export async function collectSignOutCookies(c: Context): Promise<string[]> {
  const authUrl = resolveEnvVarFromContext(c, "AUTH_URL")?.replace(/\/$/, "");
  if (!authUrl) {
    return [];
  }

  const cookie = c.req.header("cookie") ?? "";
  const origin = new URL(c.req.url).origin;

  try {
    const upstream = await fetch(`${authUrl}/sign-out`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie,
        origin,
      },
      body: "{}",
    });

    const modern = (
      upstream.headers as Headers & { getSetCookie?: () => string[] }
    ).getSetCookie?.();
    if (modern && modern.length > 0) {
      return modern;
    }

    const setCookies: string[] = [];
    upstream.headers.forEach((value, key) => {
      if (key.toLowerCase() === "set-cookie") {
        setCookies.push(value);
      }
    });
    return setCookies;
  } catch (error) {
    console.error("GDPR sign-out proxy failed", error);
    return [];
  }
}

export function redirectWithClearedSession(location: string, setCookies: string[]): Response {
  const headers = new Headers({ Location: location });
  for (const cookie of setCookies) {
    headers.append("Set-Cookie", cookie);
  }
  return new Response(null, { status: 302, headers });
}

/**
 * Member self-service delete: anonymize → clear session → redirect home.
 * AUTH_DISABLE_FAILED still clears the session and returns an error for on-page messaging.
 */
export async function handleMemberDeleteAccountPost(
  c: Context,
): Promise<
  | { kind: "redirect"; location: string; setCookies: string[] }
  | { kind: "error"; locale: Locale; message: string; setCookies?: string[] }
  | Response
> {
  const guard = await guardProfileRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const { locale, session } = guard;
  const copy = getGdprMemberCopy(locale);
  const databaseUrl = resolveEnvVarFromContext(c, "DATABASE_URL");
  if (!databaseUrl) {
    return { kind: "error", locale, message: copy.errorGeneric };
  }

  let authBaseUrl: string;
  try {
    authBaseUrl = requireAuthUrl(c);
  } catch {
    return { kind: "error", locale, message: copy.errorGeneric };
  }

  const disableAuthUser = createDisableAuthUser({
    authBaseUrl,
    cookie: c.req.header("cookie") ?? "",
    origin: new URL(c.req.url).origin,
    mode: "self",
  });

  const txDb = createTxDb(databaseUrl);
  try {
    await anonymizeUserAccount(txDb, {
      userId: session.user.id,
      actor: "self",
      disableAuthUser,
      cancelSubscription: createCancelSubscriptionForDeletion(c, databaseUrl),
    });
  } catch (error) {
    if (isGdprError(error) && error.code === "ALREADY_DELETED") {
      // Treat as success: sign out and leave.
    } else if (isGdprError(error) && error.code === "AUTH_DISABLE_FAILED") {
      const setCookies = await collectSignOutCookies(c);
      return {
        kind: "error",
        locale,
        message: mapGdprErrorMessage(error.code, locale),
        setCookies,
      };
    } else if (isGdprError(error)) {
      return {
        kind: "error",
        locale,
        message: mapGdprErrorMessage(error.code, locale),
      };
    } else {
      console.error("anonymizeUserAccount (self) failed", error);
      return { kind: "error", locale, message: copy.errorGeneric };
    }
  } finally {
    await txDb.pool.end().catch(() => undefined);
  }

  const setCookies = await collectSignOutCookies(c);
  return {
    kind: "redirect",
    location: `/${locale}`,
    setCookies,
  };
}

export async function anonymizeMemberAsAdmin(
  c: Context,
  input: { userId: string; adminId: string },
): Promise<void> {
  const databaseUrl = resolveEnvVarFromContext(c, "DATABASE_URL");
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not configured");
  }

  const authBaseUrl = requireAuthUrl(c);
  const disableAuthUser = createDisableAuthUser({
    authBaseUrl,
    cookie: c.req.header("cookie") ?? "",
    origin: new URL(c.req.url).origin,
    mode: "admin",
  });

  const txDb = createTxDb(databaseUrl);
  try {
    await anonymizeUserAccount(txDb, {
      userId: input.userId,
      actor: "admin",
      adminId: input.adminId,
      disableAuthUser,
      cancelSubscription: createCancelSubscriptionForDeletion(c, databaseUrl),
    });
  } finally {
    await txDb.pool.end().catch(() => undefined);
  }
}
