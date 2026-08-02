import { describe, expect, test } from "bun:test";
import { createDb, subscriptions, users } from "@unveiled/db";
import { eq } from "drizzle-orm";

import {
  completeOnboarding,
  getOnboardingStepPath,
  OnboardingValidationError,
  saveOnboardingStep,
  validateOnboardingStepPayload,
} from "./onboarding";

const databaseUrl = process.env.DATABASE_URL;

describe("getOnboardingStepPath", () => {
  test("new user starts at age", () => {
    expect(getOnboardingStepPath({ onboarding_complete: false }, {})).toBe("/onboarding/age");
  });

  test("uses behavior.onboarding_step when set", () => {
    expect(
      getOnboardingStepPath({ onboarding_complete: false }, { onboarding_step: "location" }),
    ).toBe("/onboarding/location");
  });

  test("progress resumes at interests after age", () => {
    expect(getOnboardingStepPath({ age_group: "26-35" }, {})).toBe("/onboarding/interests");
  });

  test("progress resumes at location after interests", () => {
    expect(getOnboardingStepPath({ interests: ["Kino"], moods: ["Leicht"] }, {})).toBe(
      "/onboarding/location",
    );
  });

  test("progress resumes at timing after location", () => {
    expect(
      getOnboardingStepPath(
        {
          interests: ["Kino"],
          moods: ["Leicht"],
          zip_code: "10115",
          country: "DE",
          city: "berlin",
        },
        {},
      ),
    ).toBe("/onboarding/timing");
  });

  test("age skip pointer resumes at interests without age_group", () => {
    expect(getOnboardingStepPath({}, { onboarding_step: "interests" })).toBe(
      "/onboarding/interests",
    );
  });
});

describe("validateOnboardingStepPayload", () => {
  test("rejects invalid interest", () => {
    expect(() =>
      validateOnboardingStepPayload("interests", {
        interests: ["NotReal"],
        moods: ["Leicht"],
      }),
    ).toThrow(OnboardingValidationError);
  });

  test("rejects Other interest without free text", () => {
    expect(() =>
      validateOnboardingStepPayload("interests", {
        interests: ["Other"],
        moods: ["Leicht"],
        interests_other: "   ",
      }),
    ).toThrow(OnboardingValidationError);
  });

  test("accepts Other interest with trimmed free text", () => {
    expect(
      validateOnboardingStepPayload("interests", {
        interests: ["Kino", "Other"],
        moods: ["Leicht"],
        interests_other: "  Spoken word  ",
      }),
    ).toEqual({
      interests: ["Kino", "Other"],
      moods: ["Leicht"],
      interests_other: "Spoken word",
    });
  });

  test("clears interests_other when Other is not selected", () => {
    expect(
      validateOnboardingStepPayload("interests", {
        interests: ["Kino"],
        moods: ["Leicht"],
        interests_other: "should be ignored",
      }),
    ).toEqual({
      interests: ["Kino"],
      moods: ["Leicht"],
      interests_other: null,
    });
  });

  test("rejects Other interest free text over max length", () => {
    expect(() =>
      validateOnboardingStepPayload("interests", {
        interests: ["Other"],
        moods: ["Leicht"],
        interests_other: "x".repeat(101),
      }),
    ).toThrow(OnboardingValidationError);
  });

  test("rejects invalid postal code", () => {
    expect(() =>
      validateOnboardingStepPayload("location", {
        zipCode: "80331",
      }),
    ).toThrow(OnboardingValidationError);
  });

  test("location payload stores zip trio, clears districts, and omits max_distance", () => {
    expect(
      validateOnboardingStepPayload("location", {
        zipCode: "10115",
      }),
    ).toEqual({
      country: "DE",
      city: "berlin",
      zip_code: "10115",
      districts: null,
    });
  });

  test("age skip returns empty profile update", () => {
    expect(validateOnboardingStepPayload("age", { skip: true })).toEqual({});
  });

  test("accepts expanded preferred languages and accessibility boolean", () => {
    expect(
      validateOnboardingStepPayload("timing", {
        timing: ["Weekend"],
        preferred_days: ["Saturday"],
        preferred_languages: ["DE", "FR", "TR"],
        accessibility: true,
      }),
    ).toEqual({
      timing: ["Weekend"],
      preferred_days: ["Saturday"],
      preferred_languages: ["DE", "FR", "TR"],
      accessibility: true,
    });
  });

  test("rejects Non-Verbal and unknown preferred languages", () => {
    expect(() =>
      validateOnboardingStepPayload("timing", {
        timing: ["Weekend"],
        preferred_days: ["Saturday"],
        preferred_languages: ["Non-Verbal"],
        accessibility: false,
      }),
    ).toThrow(OnboardingValidationError);

    expect(() =>
      validateOnboardingStepPayload("timing", {
        timing: ["Weekend"],
        preferred_days: ["Saturday"],
        preferred_languages: ["XX"],
        accessibility: false,
      }),
    ).toThrow(OnboardingValidationError);
  });
});

describe("saveOnboardingStep and completeOnboarding", () => {
  test("age skip advances without age_group", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const userId = `test-onboarding-skip-${crypto.randomUUID()}`;
    const email = `${userId}@example.com`;

    try {
      await db.insert(users).values({
        id: userId,
        email,
        profile: { first_name: "Skip", onboarding_complete: false },
      });

      const updated = await saveOnboardingStep(db, userId, "age", { skip: true });

      expect(updated.profile.age_group).toBeUndefined();
      expect(updated.profile.first_name).toBe("Skip");
      expect(updated.behavior.onboarding_step).toBe("interests");
      expect(updated.behavior.preferences_updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    } finally {
      await db.delete(users).where(eq(users.id, userId));
    }
  });

  test("partial merge preserves unrelated profile fields", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const userId = `test-onboarding-merge-${crypto.randomUUID()}`;
    const email = `${userId}@example.com`;

    try {
      await db.insert(users).values({
        id: userId,
        email,
        profile: {
          first_name: "Ada",
          last_name: "Berlin",
          onboarding_complete: false,
        },
      });

      const updated = await saveOnboardingStep(db, userId, "age", { age_group: "36-50" });

      expect(updated.profile.first_name).toBe("Ada");
      expect(updated.profile.last_name).toBe("Berlin");
      expect(updated.profile.age_group).toBe("36-50");
    } finally {
      await db.delete(users).where(eq(users.id, userId));
    }
  });

  test("full four-step save and complete round-trip", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const userId = `test-onboarding-full-${crypto.randomUUID()}`;
    const email = `${userId}@example.com`;

    try {
      await db.insert(users).values({
        id: userId,
        email,
        profile: { onboarding_complete: false },
      });

      await saveOnboardingStep(db, userId, "age", { age_group: "26-35" });
      await saveOnboardingStep(db, userId, "interests", {
        interests: ["Kino", "Theater"],
        moods: ["Leicht", "Klassisch"],
      });
      await saveOnboardingStep(db, userId, "location", {
        zipCode: "10115",
      });
      await saveOnboardingStep(db, userId, "timing", {
        timing: ["Weekend", "After Work"],
        preferred_days: ["Friday", "Saturday"],
        preferred_languages: ["DE", "EN"],
        accessibility: true,
      });

      const completed = await completeOnboarding(db, userId);

      expect(completed.profile.onboarding_complete).toBe(true);
      expect(completed.profile.age_group).toBe("26-35");
      expect(completed.profile.interests).toEqual(["Kino", "Theater"]);
      expect(completed.profile.moods).toEqual(["Leicht", "Klassisch"]);
      expect(completed.profile.zip_code).toBe("10115");
      expect(completed.profile.country).toBe("DE");
      expect(completed.profile.city).toBe("berlin");
      expect(completed.profile.districts).toBeNull();
      expect(completed.profile.max_distance).toBeUndefined();
      expect(completed.profile.timing).toEqual(["Weekend", "After Work"]);
      expect(completed.profile.preferred_days).toEqual(["Friday", "Saturday"]);
      expect(completed.profile.preferred_languages).toEqual(["DE", "EN"]);
      expect(completed.profile.accessibility).toBe(true);
      expect(completed.behavior.onboarding_completed_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(completed.behavior.onboarding_step).toBeNull();
    } finally {
      await db.delete(subscriptions).where(eq(subscriptions.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
    }
  });

  test("completion marks profile complete", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const userId = `test-onboarding-complete-${crypto.randomUUID()}`;
    const email = `${userId}@example.com`;

    try {
      await db.insert(users).values({
        id: userId,
        email,
        profile: { onboarding_complete: false },
        behavior: { onboarding_step: "timing" },
      });

      await saveOnboardingStep(db, userId, "timing", {
        timing: ["Weekend"],
        preferred_days: ["Saturday"],
        preferred_languages: ["DE"],
        accessibility: false,
      });

      const completed = await completeOnboarding(db, userId);

      expect(completed.profile.onboarding_complete).toBe(true);
      expect(completed.behavior.onboarding_completed_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
      expect(completed.behavior.onboarding_step).toBeNull();
    } finally {
      await db.delete(subscriptions).where(eq(subscriptions.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
    }
  });
});

describe("location save leaves legacy max_distance untouched", () => {
  test("pre-existing max_distance survives a zip-only location save", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const userId = `test-onboarding-legacy-distance-${crypto.randomUUID()}`;
    const email = `${userId}@example.com`;

    try {
      await db.insert(users).values({
        id: userId,
        email,
        profile: {
          onboarding_complete: false,
          max_distance: 25,
          zip_code: "10115",
          country: "DE",
          city: "berlin",
        },
        behavior: { onboarding_step: "location" },
      });

      const updated = await saveOnboardingStep(db, userId, "location", {
        zipCode: "10435",
      });

      expect(updated.profile.zip_code).toBe("10435");
      expect(updated.profile.max_distance).toBe(25);
      expect(updated.profile.districts).toBeNull();
    } finally {
      await db.delete(subscriptions).where(eq(subscriptions.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
    }
  });
});

describe("berlinIsoNow offset", () => {
  test("includes timezone offset suffix", async () => {
    const { berlinIsoNow } = await import("./onboarding");
    expect(berlinIsoNow()).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/);
  });
});
