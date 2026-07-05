import { users } from "@unveiled/db";
import { and, eq, isNull } from "drizzle-orm";
import type { Context } from "hono";

import { provisionNewUser } from "./provision-user";
import type { AppSession, AuthOptions, NeonAuthUser, SessionUser } from "./types";

type BetterAuthSessionResponse = {
  session?: {
    id: string;
    userId: string;
  } | null;
  user?: NeonAuthUser | null;
};

function normalizeAuthUrl(authUrl: string): string {
  return authUrl.replace(/\/$/, "");
}

function toSessionUser(row: typeof users.$inferSelect): SessionUser {
  return {
    id: row.id,
    email: row.email,
    role: row.role,
    partnerId: row.partnerId,
    credits: row.credits,
    onboardingComplete: row.profile.onboarding_complete ?? false,
  };
}

async function fetchBetterAuthSession(
  c: Context,
  authUrl: string,
): Promise<BetterAuthSessionResponse | null> {
  try {
    const response = await fetch(`${normalizeAuthUrl(authUrl)}/get-session`, {
      headers: {
        cookie: c.req.header("cookie") ?? "",
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as BetterAuthSessionResponse | null;
    if (!data?.session || !data.user) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
}

async function loadAppUser(db: AuthOptions["db"], userId: string) {
  return db.query.users.findFirst({
    where: and(eq(users.id, userId), isNull(users.deletedAt)),
  });
}

export async function getSession(c: Context, options: AuthOptions): Promise<AppSession | null> {
  const betterAuth = await fetchBetterAuthSession(c, options.authUrl);
  if (!betterAuth?.user) {
    return null;
  }

  let row = await loadAppUser(options.db, betterAuth.user.id);

  if (!row) {
    await provisionNewUser(options.db, betterAuth.user);
    row = await loadAppUser(options.db, betterAuth.user.id);
  }

  if (!row) {
    return null;
  }

  return { user: toSessionUser(row) };
}
