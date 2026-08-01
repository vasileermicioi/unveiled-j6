import {
  type Db,
  type OnboardingStepKey,
  PostalValidationError,
  type User,
  type UserBehavior,
  type UserProfile,
  users,
  validatePostalCode,
} from "@unveiled/db";
import { eq } from "drizzle-orm";

import {
  AGE_GROUPS,
  type AgeGroup,
  INTERESTS,
  INTERESTS_OTHER_MAX_LENGTH,
  MAX_DISTANCE_MAX,
  MAX_DISTANCE_MIN,
  MOODS,
  PREFERRED_LANGUAGES,
  TIMING_OPTIONS,
  WEEKDAYS,
} from "./constants";

export {
  AGE_GROUPS,
  type AgeGroup,
  INTERESTS,
  INTERESTS_OTHER_MAX_LENGTH,
  MAX_DISTANCE_MAX,
  MAX_DISTANCE_MIN,
  MOODS,
  PREFERRED_LANGUAGES,
  TIMING_OPTIONS,
  WEEKDAYS,
} from "./constants";

export type OnboardingStep = OnboardingStepKey;

export type AgeStepPayload = { skip: true } | { age_group: AgeGroup };

export type InterestsStepPayload = {
  interests: string[];
  moods: string[];
  interests_other?: string | null;
};

export type LocationStepPayload = {
  zipCode: string;
  country?: string;
  city?: string;
  /** Integer km within `MAX_DISTANCE_MIN`–`MAX_DISTANCE_MAX`; required on location saves. */
  maxDistance: number;
};

export type TimingStepPayload = {
  timing: string[];
  preferred_days: string[];
  preferred_languages: string[];
  accessibility: boolean;
};

export type OnboardingStepPayload =
  | AgeStepPayload
  | InterestsStepPayload
  | LocationStepPayload
  | TimingStepPayload;

export class OnboardingValidationError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "OnboardingValidationError";
    this.code = code;
  }
}

/**
 * Validates travel distance (km) for profile preference / onboarding location saves.
 * Requires a finite integer in `[MAX_DISTANCE_MIN, MAX_DISTANCE_MAX]`.
 */
export function validateMaxDistance(value: unknown): number {
  if (value === undefined || value === null || value === "") {
    throw new OnboardingValidationError("invalid_max_distance", "max_distance is required");
  }

  const numeric =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value.trim())
        : Number.NaN;

  if (!Number.isFinite(numeric) || !Number.isInteger(numeric)) {
    throw new OnboardingValidationError("invalid_max_distance", "max_distance must be an integer");
  }

  if (numeric < MAX_DISTANCE_MIN || numeric > MAX_DISTANCE_MAX) {
    throw new OnboardingValidationError(
      "invalid_max_distance",
      `max_distance must be between ${MAX_DISTANCE_MIN} and ${MAX_DISTANCE_MAX}`,
    );
  }

  return numeric;
}

const STEP_PATHS: Record<OnboardingStep, string> = {
  age: "/onboarding/age",
  interests: "/onboarding/interests",
  location: "/onboarding/location",
  timing: "/onboarding/timing",
};

const NEXT_STEP: Record<OnboardingStep, OnboardingStep | null> = {
  age: "interests",
  interests: "location",
  location: "timing",
  timing: null,
};

function assertAllowlist(
  values: readonly string[],
  allowed: readonly string[],
  code: string,
): void {
  for (const value of values) {
    if (!allowed.includes(value)) {
      throw new OnboardingValidationError(code, `Invalid value: ${value}`);
    }
  }
}

function getTimeZoneOffsetMs(timeZone: string, date: Date): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = formatter.formatToParts(date);
  const filled: Record<string, string> = {};

  for (const { type, value } of parts) {
    if (type !== "literal") {
      filled[type] = value;
    }
  }

  const asUtc = Date.UTC(
    Number(filled.year),
    Number(filled.month) - 1,
    Number(filled.day),
    Number(filled.hour),
    Number(filled.minute),
    Number(filled.second),
  );

  return asUtc - date.getTime();
}

export function berlinIsoNow(): string {
  const now = new Date();
  const offsetMs = getTimeZoneOffsetMs("Europe/Berlin", now);
  const offsetSign = offsetMs >= 0 ? "+" : "-";
  const offsetAbs = Math.abs(offsetMs);
  const offsetHours = String(Math.floor(offsetAbs / 3_600_000)).padStart(2, "0");
  const offsetMinutes = String(Math.floor((offsetAbs % 3_600_000) / 60_000)).padStart(2, "0");
  const offset = `${offsetSign}${offsetHours}:${offsetMinutes}`;

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const pick = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === type)?.value.padStart(2, "0") ?? "00";

  return `${pick("year")}-${pick("month")}-${pick("day")}T${pick("hour")}:${pick("minute")}:${pick("second")}${offset}`;
}

function isAgeStepDone(profile: UserProfile): boolean {
  if (profile.age_group != null) {
    return true;
  }

  return (
    profile.interests != null ||
    profile.moods != null ||
    profile.zip_code != null ||
    profile.districts != null ||
    profile.max_distance != null ||
    profile.timing != null ||
    profile.preferred_days != null ||
    profile.preferred_languages != null ||
    profile.accessibility != null
  );
}

function isInterestsStepDone(profile: UserProfile): boolean {
  return profile.interests != null && profile.moods != null;
}

function isLocationStepDone(profile: UserProfile): boolean {
  return typeof profile.zip_code === "string" && profile.zip_code.trim().length > 0;
}

function inferOnboardingStep(profile: UserProfile): OnboardingStep {
  if (!isAgeStepDone(profile)) {
    return "age";
  }

  if (!isInterestsStepDone(profile)) {
    return "interests";
  }

  if (!isLocationStepDone(profile)) {
    return "location";
  }

  return "timing";
}

export function getOnboardingStepPath(profile: UserProfile, behavior: UserBehavior = {}): string {
  const step = behavior.onboarding_step ?? inferOnboardingStep(profile);
  return STEP_PATHS[step];
}

export function validateOnboardingStepPayload(
  step: OnboardingStep,
  payload: OnboardingStepPayload,
): UserProfile {
  switch (step) {
    case "age": {
      if ("skip" in payload && payload.skip) {
        return {};
      }

      if (!("age_group" in payload)) {
        throw new OnboardingValidationError("invalid_age_payload", "age_group or skip is required");
      }

      if (!AGE_GROUPS.includes(payload.age_group)) {
        throw new OnboardingValidationError(
          "invalid_age_group",
          `Invalid age group: ${payload.age_group}`,
        );
      }

      return { age_group: payload.age_group };
    }

    case "interests": {
      const { interests, moods, interests_other } = payload as InterestsStepPayload;
      assertAllowlist(interests, INTERESTS, "invalid_interest");
      assertAllowlist(moods, MOODS, "invalid_mood");

      if (interests.includes("Other")) {
        const trimmed = (interests_other ?? "").trim();
        if (!trimmed) {
          throw new OnboardingValidationError(
            "interests_other_required",
            "interests_other is required when Other is selected",
          );
        }
        if (trimmed.length > INTERESTS_OTHER_MAX_LENGTH) {
          throw new OnboardingValidationError(
            "interests_other_too_long",
            `interests_other must be at most ${INTERESTS_OTHER_MAX_LENGTH} characters`,
          );
        }
        return { interests, moods, interests_other: trimmed };
      }

      return { interests, moods, interests_other: null };
    }

    case "location": {
      const { zipCode, country, city, maxDistance } = payload as LocationStepPayload;
      const max_distance = validateMaxDistance(maxDistance);
      try {
        const location = validatePostalCode({ country, city, zipCode });
        return {
          country: location.country,
          city: location.city,
          zip_code: location.zipCode,
          districts: null,
          max_distance,
        };
      } catch (error) {
        if (error instanceof PostalValidationError) {
          throw new OnboardingValidationError(error.code.toLowerCase(), error.message);
        }
        throw error;
      }
    }

    case "timing": {
      const { timing, preferred_days, preferred_languages, accessibility } =
        payload as TimingStepPayload;

      if (typeof accessibility !== "boolean") {
        throw new OnboardingValidationError(
          "invalid_accessibility",
          "accessibility must be a boolean",
        );
      }

      assertAllowlist(timing, TIMING_OPTIONS, "invalid_timing");
      assertAllowlist(preferred_days, WEEKDAYS, "invalid_preferred_day");
      assertAllowlist(preferred_languages, PREFERRED_LANGUAGES, "invalid_preferred_language");

      return {
        timing,
        preferred_days,
        preferred_languages,
        accessibility,
      };
    }

    default: {
      const exhaustive: never = step;
      throw new OnboardingValidationError("invalid_step", `Unknown onboarding step: ${exhaustive}`);
    }
  }
}

export async function saveOnboardingStep(
  db: Db,
  userId: string,
  step: OnboardingStep,
  payload: OnboardingStepPayload,
): Promise<User> {
  const profileUpdate = validateOnboardingStepPayload(step, payload);

  const row = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!row) {
    throw new Error(`User not found: ${userId}`);
  }

  const nextStep = NEXT_STEP[step];
  const mergedProfile: UserProfile = { ...row.profile, ...profileUpdate };
  const mergedBehavior: UserBehavior = {
    ...row.behavior,
    onboarding_step: nextStep,
    preferences_updated_at: berlinIsoNow(),
  };

  const [updated] = await db
    .update(users)
    .set({
      profile: mergedProfile,
      behavior: mergedBehavior,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  if (!updated) {
    throw new Error(`Failed to update user ${userId}`);
  }

  return updated;
}

export async function completeOnboarding(db: Db, userId: string): Promise<User> {
  const row = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!row) {
    throw new Error(`User not found: ${userId}`);
  }

  const [updated] = await db
    .update(users)
    .set({
      profile: {
        ...row.profile,
        onboarding_complete: true,
      },
      behavior: {
        ...row.behavior,
        onboarding_step: null,
        onboarding_completed_at: berlinIsoNow(),
      },
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  if (!updated) {
    throw new Error(`Failed to complete onboarding for user ${userId}`);
  }

  return updated;
}
