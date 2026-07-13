import { type Db, type User, type UserBehavior, type UserProfile, users } from "@unveiled/db";
import { and, eq, ne } from "drizzle-orm";

import {
  berlinIsoNow,
  type InterestsStepPayload,
  type LocationStepPayload,
  OnboardingValidationError,
  type TimingStepPayload,
  validateOnboardingStepPayload,
} from "./onboarding";

export class ProfileValidationError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ProfileValidationError";
    this.code = code;
  }
}

export type ProfileIdentityPayload = {
  first_name: string;
  last_name: string;
  email: string;
};

export type CulturalPreferencesPayload = InterestsStepPayload &
  LocationStepPayload &
  TimingStepPayload;

export type SyncAuthEmailFn = (args: { newEmail: string; previousEmail: string }) => Promise<void>;

function normalizeName(value: string, field: "first_name" | "last_name"): string {
  const trimmed = value.trim();
  if (!trimmed) {
    throw new ProfileValidationError(`invalid_${field}`, `${field} is required`);
  }
  return trimmed;
}

function normalizeEmail(value: string): string {
  const trimmed = value.trim().toLowerCase();
  if (!trimmed?.includes("@")) {
    throw new ProfileValidationError("invalid_email", "A valid email is required");
  }
  return trimmed;
}

export function validateCulturalPreferencesPayload(
  payload: CulturalPreferencesPayload,
): UserProfile {
  try {
    const interestsUpdate = validateOnboardingStepPayload("interests", {
      interests: payload.interests,
      moods: payload.moods,
    });
    const locationUpdate = validateOnboardingStepPayload("location", {
      districts: payload.districts,
      max_distance: payload.max_distance,
    });
    const timingUpdate = validateOnboardingStepPayload("timing", {
      timing: payload.timing,
      preferred_days: payload.preferred_days,
      preferred_languages: payload.preferred_languages,
      accessibility: payload.accessibility,
    });

    return {
      ...interestsUpdate,
      ...locationUpdate,
      ...timingUpdate,
    };
  } catch (error) {
    if (error instanceof OnboardingValidationError) {
      throw new ProfileValidationError(error.code, error.message);
    }
    throw error;
  }
}

/**
 * Updates identity fields on `public.users`. When email changes, optionally syncs
 * Neon Auth / Better Auth via `syncAuthEmail` (fail closed with revert).
 */
export async function updateProfileIdentity(
  db: Db,
  userId: string,
  payload: ProfileIdentityPayload,
  options?: { syncAuthEmail?: SyncAuthEmailFn },
): Promise<User> {
  const first_name = normalizeName(payload.first_name, "first_name");
  const last_name = normalizeName(payload.last_name, "last_name");
  const email = normalizeEmail(payload.email);

  const row = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!row) {
    throw new Error(`User not found: ${userId}`);
  }

  const previousEmail = row.email;
  const emailChanged = email !== previousEmail.toLowerCase();

  if (emailChanged) {
    const conflict = await db.query.users.findFirst({
      where: and(eq(users.email, email), ne(users.id, userId)),
    });

    if (conflict) {
      throw new ProfileValidationError("email_taken", "Email is already in use");
    }
  }

  const mergedProfile: UserProfile = {
    ...row.profile,
    first_name,
    last_name,
  };

  const [updated] = await db
    .update(users)
    .set({
      email,
      profile: mergedProfile,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning();

  if (!updated) {
    throw new Error(`Failed to update identity for user ${userId}`);
  }

  if (emailChanged && options?.syncAuthEmail) {
    try {
      await options.syncAuthEmail({ newEmail: email, previousEmail });
    } catch (error) {
      await db
        .update(users)
        .set({
          email: previousEmail,
          profile: row.profile,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      if (error instanceof ProfileValidationError) {
        throw error;
      }

      throw new ProfileValidationError(
        "auth_email_sync_failed",
        error instanceof Error ? error.message : "Failed to sync email with auth provider",
      );
    }
  }

  return updated;
}

/**
 * Updates cultural preference fields for an onboarded member.
 * Sets `behavior.preferences_updated_at` without mutating onboarding state.
 */
export async function updateCulturalPreferences(
  db: Db,
  userId: string,
  payload: CulturalPreferencesPayload,
): Promise<User> {
  const profileUpdate = validateCulturalPreferencesPayload(payload);

  const row = await db.query.users.findFirst({
    where: eq(users.id, userId),
  });

  if (!row) {
    throw new Error(`User not found: ${userId}`);
  }

  const previousOnboardingStep = row.behavior.onboarding_step;
  const previousOnboardingComplete = row.profile.onboarding_complete;

  const mergedProfile: UserProfile = {
    ...row.profile,
    ...profileUpdate,
    // Preserve onboarding completion flag explicitly
    onboarding_complete: previousOnboardingComplete,
  };

  const mergedBehavior: UserBehavior = {
    ...row.behavior,
    onboarding_step: previousOnboardingStep,
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
    throw new Error(`Failed to update preferences for user ${userId}`);
  }

  return updated;
}
