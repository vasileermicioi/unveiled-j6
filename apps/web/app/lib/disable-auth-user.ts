import { type DisableAuthUserFn, deletedEmailPlaceholder } from "@unveiled/db";

export type DisableAuthUserMode = "self" | "admin";

export type CreateDisableAuthUserOptions = {
  authBaseUrl: string;
  cookie: string;
  origin: string;
  /**
   * `self` → Better Auth `/delete-user` for the signed-in member.
   * `admin` → Admin `/admin/remove-user`, with ban + email wipe fallback.
   */
  mode: DisableAuthUserMode;
};

async function authJson(
  authBaseUrl: string,
  path: string,
  options: { cookie: string; origin: string; body: Record<string, unknown> },
): Promise<Response> {
  return fetch(`${authBaseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie: options.cookie,
      origin: options.origin,
    },
    body: JSON.stringify(options.body),
  });
}

async function removeOrBanAuthUser(
  options: CreateDisableAuthUserOptions,
  userId: string,
): Promise<void> {
  const { authBaseUrl, cookie, origin } = options;

  const remove = await authJson(authBaseUrl, "/admin/remove-user", {
    cookie,
    origin,
    body: { userId },
  });

  if (remove.ok) {
    return;
  }

  const ban = await authJson(authBaseUrl, "/admin/ban-user", {
    cookie,
    origin,
    body: {
      userId,
      banReason: "GDPR account deletion",
    },
  });

  if (!ban.ok) {
    const removeDetail = await remove.text().catch(() => "");
    const banDetail = await ban.text().catch(() => "");
    throw new Error(
      `Auth remove-user failed (${remove.status}): ${removeDetail || "no body"}; ` +
        `ban-user failed (${ban.status}): ${banDetail || "no body"}`,
    );
  }

  const email = deletedEmailPlaceholder(userId);
  const update = await authJson(authBaseUrl, "/admin/update-user", {
    cookie,
    origin,
    body: {
      userId,
      data: { email, name: "Deleted User", emailVerified: false },
    },
  });

  if (!update.ok) {
    const detail = await update.text().catch(() => "");
    throw new Error(`Auth banned but email wipe failed (${update.status}): ${detail || "no body"}`);
  }
}

/**
 * Concrete Neon Auth / Better Auth disable collaborator for GDPR anonymization.
 *
 * Prefer Admin `remove-user` (admin mode) or `/delete-user` (self mode) so the real
 * email does not remain in neon_auth. Fallback for admin: `ban-user` + update email
 * to `deleted-{userId}@deleted.local`.
 */
export function createDisableAuthUser(options: CreateDisableAuthUserOptions): DisableAuthUserFn {
  const authBaseUrl = options.authBaseUrl.replace(/\/$/, "");

  return async ({ userId }) => {
    if (options.mode === "self") {
      const response = await authJson(authBaseUrl, "/delete-user", {
        cookie: options.cookie,
        origin: options.origin,
        body: {},
      });

      if (response.ok) {
        return;
      }

      // If self-delete is disabled on the Auth project, fall through to admin remove
      // using the caller's cookie (works when an Auth-side admin deletes their own test user).
      const detail = await response.text().catch(() => "");
      if (response.status !== 404 && response.status !== 403 && response.status !== 501) {
        throw new Error(`Auth delete-user failed (${response.status}): ${detail || "no body"}`);
      }

      await removeOrBanAuthUser({ ...options, authBaseUrl, mode: "admin" }, userId);
      return;
    }

    await removeOrBanAuthUser({ ...options, authBaseUrl }, userId);
  };
}
