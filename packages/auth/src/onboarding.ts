import {
  type AgeGroup,
  type Db,
  type OnboardingStepKey,
  type User,
  type UserBehavior,
  type UserProfile,
  users,
} from "@unveiled/db";
import { eq } from "drizzle-orm";

export const AGE_GROUPS = ["18-25", "26-35", "36-50", "50+"] as const;
export const INTERESTS = [
  "Theater",
  "Kino",
  "Museum",
  "Ausstellung",
  "Konzert",
  "Talk/Lesung",
  "Comedy",
  "Tanz/Performance",
] as const;
export const MOODS = ["Leicht", "Experimentell", "Klassisch", "Politisch", "Fam"] as const;
export const DISTRICTS = [
  "Mitte",
  "X-Berg",
  "P-Berg",
  "Charlottenburg",
  "Wedding",
  "F-Hain",
  "Schöneberg",
] as const;
export const TIMING_OPTIONS = ["After Work", "Weekend", "Day"] as const;
export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;
export const PREFERRED_LANGUAGES = ["DE", "EN", "Non-Verbal"] as const;
export const MAX_DISTANCE_MIN = 1;
export const MAX_DISTANCE_MAX = 25;

export type OnboardingStep = OnboardingStepKey;

export type AgeStepPayload = { skip: true } | { age_group: AgeGroup };

export type InterestsStepPayload = {
  interests: string[];
  moods: string[];
};

export type LocationStepPayload = {
  districts: string[];
  max_distance: number;
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

function assertMaxDistance(value: number): void {
  if (!Number.isInteger(value) || value < MAX_DISTANCE_MIN || value > MAX_DISTANCE_MAX) {
    throw new OnboardingValidationError(
      "invalid_max_distance",
      `max_distance must be an integer between ${MAX_DISTANCE_MIN} and ${MAX_DISTANCE_MAX}`,
    );
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
  return profile.districts != null && profile.max_distance != null;
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
      const { interests, moods } = payload as InterestsStepPayload;
      assertAllowlist(interests, INTERESTS, "invalid_interest");
      assertAllowlist(moods, MOODS, "invalid_mood");
      return { interests, moods };
    }

    case "location": {
      const { districts, max_distance } = payload as LocationStepPayload;
      assertAllowlist(districts, DISTRICTS, "invalid_district");
      assertMaxDistance(max_distance);
      return { districts, max_distance };
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
