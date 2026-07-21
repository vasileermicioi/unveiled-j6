import {
  type CulturalPreferencesPayload,
  type ProfileIdentityPayload,
  ProfileValidationError,
  updateCulturalPreferences,
  updateProfileIdentity,
} from "@unveiled/auth";
import type { Context } from "hono";

import { getAuthOptions, getSession } from "./auth";
import { buildLoginRedirectUrl } from "./auth-middleware";
import type { Locale } from "./locale";
import { getLocaleParam } from "./onboarding-route";
import { getProfileCopy } from "./profile-content";
import { resolveEnvVarFromContext } from "./runtime-env";

type ParsedBody = Record<string, string | File | (string | File)[]>;

function asString(value: string | File | (string | File)[] | undefined): string {
  if (value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" ? first : "";
  }

  return typeof value === "string" ? value : "";
}

function asStringArray(value: string | File | (string | File)[] | undefined): string[] {
  if (value === undefined) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }

  return typeof value === "string" ? [value] : [];
}

function parseBooleanField(value: string | File | (string | File)[] | undefined): boolean {
  const normalized = asString(value);
  return normalized === "true" || normalized === "on" || normalized === "1";
}

export function parseIdentityPayload(body: ParsedBody): ProfileIdentityPayload {
  return {
    first_name: asString(body.first_name),
    last_name: asString(body.last_name),
    email: asString(body.email),
  };
}

export function parsePreferencesPayload(body: ParsedBody): CulturalPreferencesPayload {
  const maxDistanceRaw = asString(body.max_distance);
  const max_distance = maxDistanceRaw ? Number.parseInt(maxDistanceRaw, 10) : Number.NaN;

  return {
    interests: asStringArray(body.interests),
    moods: asStringArray(body.moods),
    districts: asStringArray(body.districts),
    max_distance,
    timing: asStringArray(body.timing),
    preferred_days: asStringArray(body.preferred_days),
    preferred_languages: asStringArray(body.preferred_languages),
    accessibility: parseBooleanField(body.accessibility),
  };
}

export type ProfileGuardOk = {
  ok: true;
  locale: Locale;
  session: NonNullable<Awaited<ReturnType<typeof getSession>>>;
};

export type ProfileGuardFail = {
  ok: false;
  response: Response;
};

export async function guardProfileRoute(c: Context): Promise<ProfileGuardOk | ProfileGuardFail> {
  const locale = getLocaleParam(c.req.param("locale"));
  const session = await getSession(c);
  const url = new URL(c.req.url);
  const returnPath = `${url.pathname}${url.search}`;

  if (!session) {
    return {
      ok: false,
      response: c.redirect(buildLoginRedirectUrl(locale, returnPath), 302),
    };
  }

  if (session.user.role === "PARTNER") {
    return {
      ok: false,
      response: c.redirect(`/${locale}/partner`, 302),
    };
  }

  if (session.user.role !== "USER" && session.user.role !== "ADMIN") {
    return {
      ok: false,
      response: c.redirect(`/${locale}`, 302),
    };
  }

  return { ok: true, locale, session };
}

async function syncAuthEmail(
  c: Context,
  args: { newEmail: string; previousEmail: string },
): Promise<void> {
  const authUrl = resolveEnvVarFromContext(c, "AUTH_URL")?.replace(/\/$/, "");
  if (!authUrl) {
    throw new ProfileValidationError("auth_email_sync_failed", "AUTH_URL is not configured");
  }

  const cookie = c.req.header("cookie") ?? "";
  const response = await fetch(`${authUrl}/change-email`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      cookie,
      origin: new URL(c.req.url).origin,
    },
    body: JSON.stringify({ newEmail: args.newEmail }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new ProfileValidationError(
      "auth_email_sync_failed",
      detail || `Auth provider rejected email change (${response.status})`,
    );
  }
}

export async function handleProfileIdentityPost(c: Context): Promise<
  | { kind: "redirect"; location: string }
  | {
      kind: "validation-error";
      locale: Locale;
      message: string;
      values: ProfileIdentityPayload;
    }
  | Response
> {
  const guard = await guardProfileRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const { locale, session } = guard;
  const body = (await c.req.parseBody()) as ParsedBody;
  const copy = getProfileCopy(locale);
  const payload = parseIdentityPayload(body);

  try {
    const { db } = getAuthOptions();
    await updateProfileIdentity(db, session.user.id, payload, {
      syncAuthEmail: (args) => syncAuthEmail(c, args),
    });
    return {
      kind: "redirect",
      location: `/${locale}/profile/details?saved=identity`,
    };
  } catch (error) {
    if (error instanceof ProfileValidationError) {
      return {
        kind: "validation-error",
        locale,
        message: copy.validationError,
        values: payload,
      };
    }
    throw error;
  }
}

export async function handleProfilePreferencesPost(
  c: Context,
): Promise<
  | { kind: "redirect"; location: string }
  | { kind: "validation-error"; locale: Locale; message: string }
  | Response
> {
  const guard = await guardProfileRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const { locale, session } = guard;
  const body = (await c.req.parseBody()) as ParsedBody;
  const copy = getProfileCopy(locale);

  try {
    const payload = parsePreferencesPayload(body);
    const { db } = getAuthOptions();
    await updateCulturalPreferences(db, session.user.id, payload);
    return {
      kind: "redirect",
      location: `/${locale}/profile/preferences?saved=1`,
    };
  } catch (error) {
    if (error instanceof ProfileValidationError) {
      return {
        kind: "validation-error",
        locale,
        message: copy.validationError,
      };
    }
    throw error;
  }
}
