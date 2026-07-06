import {
  type AgeStepPayload,
  type AppSession,
  completeOnboarding,
  getOnboardingStepPath,
  type InterestsStepPayload,
  type LocationStepPayload,
  type OnboardingStep,
  OnboardingValidationError,
  saveOnboardingStep,
  type TimingStepPayload,
} from "@unveiled/auth";
import type { AgeGroup, UserProfile } from "@unveiled/db";
import type { Context } from "hono";

import { getAuthOptions, getSession } from "./auth";
import type { Locale } from "./locale";
import { isValidLocale } from "./locale";
import { getOnboardingCopy } from "./onboarding-content";

export const ONBOARDING_STEP_PATHS: Record<OnboardingStep, string> = {
  age: "/onboarding/age",
  interests: "/onboarding/interests",
  location: "/onboarding/location",
  timing: "/onboarding/timing",
};

export const ONBOARDING_NEXT_PATHS: Record<OnboardingStep, string | null> = {
  age: "/onboarding/interests",
  interests: "/onboarding/location",
  location: "/onboarding/timing",
  timing: null,
};

export function getLocaleParam(value: string | undefined): Locale {
  return value && isValidLocale(value) ? value : "de";
}

type ParsedBody = Record<string, string | File | (string | File)[]>;

function asString(value: string | File | (string | File)[] | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" ? first : undefined;
  }

  return typeof value === "string" ? value : undefined;
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

export function parseAgePayload(body: ParsedBody): AgeStepPayload {
  if (asString(body.action) === "skip") {
    return { skip: true };
  }

  const ageGroup = asString(body.age_group);
  if (!ageGroup) {
    throw new OnboardingValidationError("invalid_age_payload", "age_group or skip is required");
  }

  return { age_group: ageGroup as AgeGroup };
}

export function parseInterestsPayload(body: ParsedBody): InterestsStepPayload {
  return {
    interests: asStringArray(body.interests),
    moods: asStringArray(body.moods),
  };
}

export function parseLocationPayload(body: ParsedBody): LocationStepPayload {
  const maxDistanceRaw = asString(body.max_distance);
  const max_distance = maxDistanceRaw ? Number.parseInt(maxDistanceRaw, 10) : Number.NaN;

  return {
    districts: asStringArray(body.districts),
    max_distance,
  };
}

export function parseTimingPayload(body: ParsedBody): TimingStepPayload {
  return {
    timing: asStringArray(body.timing),
    preferred_days: asStringArray(body.preferred_days),
    preferred_languages: asStringArray(body.preferred_languages),
    accessibility: parseBooleanField(body.accessibility),
  };
}

export type OnboardingGuardResult =
  | { ok: true; session: AppSession; locale: Locale }
  | { ok: false; response: Response };

export async function guardOnboardingStep(
  c: Context,
  step: OnboardingStep,
): Promise<OnboardingGuardResult> {
  const locale = getLocaleParam(c.req.param("locale"));
  const session = await getSession(c);

  if (!session) {
    return { ok: false, response: c.redirect(`/${locale}/login`, 302) };
  }

  if (session.user.role !== "USER") {
    return { ok: false, response: c.redirect(`/${locale}`, 302) };
  }

  if (session.user.onboardingComplete) {
    return { ok: false, response: c.redirect(`/${locale}/events`, 302) };
  }

  const resolvedPath = getOnboardingStepPath(session.user.profile, session.user.behavior);
  const expectedPath = ONBOARDING_STEP_PATHS[step];

  if (resolvedPath !== expectedPath) {
    return { ok: false, response: c.redirect(`/${locale}${resolvedPath}`, 302) };
  }

  return { ok: true, session, locale };
}

export async function redirectOnboardingEntry(c: Context): Promise<Response> {
  const locale = getLocaleParam(c.req.param("locale"));
  const session = await getSession(c);

  if (!session) {
    return c.redirect(`/${locale}/login`, 302);
  }

  if (session.user.role !== "USER") {
    return c.redirect(`/${locale}`, 302);
  }

  if (session.user.onboardingComplete) {
    return c.redirect(`/${locale}/events`, 302);
  }

  const stepPath = getOnboardingStepPath(session.user.profile, session.user.behavior);
  return c.redirect(`/${locale}${stepPath}`, 302);
}

export type OnboardingPostResult =
  | { kind: "redirect"; location: string }
  | { kind: "validation-error"; locale: Locale; profile: UserProfile; message: string };

export async function handleOnboardingPost(
  c: Context,
  step: OnboardingStep,
  parsePayload: (body: ParsedBody) => Parameters<typeof saveOnboardingStep>[3],
): Promise<OnboardingPostResult | Response> {
  const guard = await guardOnboardingStep(c, step);
  if (!guard.ok) {
    return guard.response;
  }

  const { session, locale } = guard;
  const body = (await c.req.parseBody()) as ParsedBody;

  try {
    const payload = parsePayload(body);
    const { db } = getAuthOptions();
    await saveOnboardingStep(db, session.user.id, step, payload);

    if (step === "timing") {
      await completeOnboarding(db, session.user.id);
      return { kind: "redirect", location: `/${locale}/membership` };
    }

    const nextPath = ONBOARDING_NEXT_PATHS[step];
    return { kind: "redirect", location: `/${locale}${nextPath}` };
  } catch (error) {
    if (error instanceof OnboardingValidationError) {
      return {
        kind: "validation-error",
        locale,
        profile: session.user.profile,
        message: getOnboardingCopy(locale).validationError,
      };
    }

    throw error;
  }
}
