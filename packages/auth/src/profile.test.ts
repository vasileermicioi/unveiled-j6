import { describe, expect, test } from "bun:test";
import { createDb, users } from "@unveiled/db";
import { eq } from "drizzle-orm";

import {
  ProfileValidationError,
  updateCulturalPreferences,
  updateProfileIdentity,
  validateCulturalPreferencesPayload,
} from "./profile";

const databaseUrl = process.env.DATABASE_URL;

const validPreferences = {
  interests: ["Kino"],
  moods: ["Leicht"],
  districts: ["Mitte"],
  max_distance: 10,
  timing: ["Weekend"],
  preferred_days: ["Saturday"],
  preferred_languages: ["DE"],
  accessibility: false,
};

describe("validateCulturalPreferencesPayload", () => {
  test("rejects invalid interest", () => {
    expect(() =>
      validateCulturalPreferencesPayload({
        ...validPreferences,
        interests: ["NotReal"],
      }),
    ).toThrow(ProfileValidationError);
  });

  test("rejects max_distance out of range", () => {
    expect(() =>
      validateCulturalPreferencesPayload({
        ...validPreferences,
        max_distance: 0,
      }),
    ).toThrow(ProfileValidationError);

    expect(() =>
      validateCulturalPreferencesPayload({
        ...validPreferences,
        max_distance: 26,
      }),
    ).toThrow(ProfileValidationError);
  });

  test("accepts valid preference payload", () => {
    expect(validateCulturalPreferencesPayload(validPreferences)).toEqual({
      interests: ["Kino"],
      moods: ["Leicht"],
      districts: ["Mitte"],
      max_distance: 10,
      timing: ["Weekend"],
      preferred_days: ["Saturday"],
      preferred_languages: ["DE"],
      accessibility: false,
    });
  });
});

describe("updateCulturalPreferences", () => {
  test("merges preferences without mutating onboarding state", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const userId = `test-profile-prefs-${crypto.randomUUID()}`;
    const email = `${userId}@example.com`;

    try {
      await db.insert(users).values({
        id: userId,
        email,
        profile: {
          first_name: "Ada",
          last_name: "Lovelace",
          onboarding_complete: true,
          age_group: "26-35",
          interests: ["Theater"],
          moods: ["Leicht"],
        },
        behavior: {
          onboarding_step: null,
          onboarding_completed_at: "2026-01-01T12:00:00+01:00",
        },
      });

      const updated = await updateCulturalPreferences(db, userId, validPreferences);

      expect(updated.profile.first_name).toBe("Ada");
      expect(updated.profile.age_group).toBe("26-35");
      expect(updated.profile.onboarding_complete).toBe(true);
      expect(updated.profile.interests).toEqual(["Kino"]);
      expect(updated.profile.moods).toEqual(["Leicht"]);
      expect(updated.profile.districts).toEqual(["Mitte"]);
      expect(updated.profile.max_distance).toBe(10);
      expect(updated.behavior.onboarding_step).toBeNull();
      expect(updated.behavior.onboarding_completed_at).toBe("2026-01-01T12:00:00+01:00");
      expect(updated.behavior.preferences_updated_at).toBeTruthy();
      expect(updated.behavior.preferences_updated_at).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/,
      );
    } finally {
      await db.delete(users).where(eq(users.id, userId));
    }
  });
});

describe("updateProfileIdentity", () => {
  test("rejects empty names", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const userId = `test-profile-identity-${crypto.randomUUID()}`;
    const email = `${userId}@example.com`;

    try {
      await db.insert(users).values({
        id: userId,
        email,
        profile: { first_name: "Ada", last_name: "Lovelace", onboarding_complete: true },
      });

      await expect(
        updateProfileIdentity(db, userId, {
          first_name: "  ",
          last_name: "Lovelace",
          email,
        }),
      ).rejects.toBeInstanceOf(ProfileValidationError);

      await expect(
        updateProfileIdentity(db, userId, {
          first_name: "Ada",
          last_name: "",
          email,
        }),
      ).rejects.toBeInstanceOf(ProfileValidationError);
    } finally {
      await db.delete(users).where(eq(users.id, userId));
    }
  });

  test("rejects duplicate email", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const userId = `test-profile-dup-a-${crypto.randomUUID()}`;
    const otherId = `test-profile-dup-b-${crypto.randomUUID()}`;
    const email = `${userId}@example.com`;
    const otherEmail = `${otherId}@example.com`;

    try {
      await db.insert(users).values([
        {
          id: userId,
          email,
          profile: { first_name: "Ada", last_name: "Lovelace", onboarding_complete: true },
        },
        {
          id: otherId,
          email: otherEmail,
          profile: { first_name: "Other", last_name: "User", onboarding_complete: true },
        },
      ]);

      await expect(
        updateProfileIdentity(db, userId, {
          first_name: "Ada",
          last_name: "Lovelace",
          email: otherEmail,
        }),
      ).rejects.toMatchObject({ code: "email_taken" });
    } finally {
      await db.delete(users).where(eq(users.id, userId));
      await db.delete(users).where(eq(users.id, otherId));
    }
  });

  test("updates names and email; reverts when auth sync fails", async () => {
    if (!databaseUrl) {
      console.warn("DATABASE_URL not set — skipping integration test");
      return;
    }

    const db = createDb(databaseUrl);
    const userId = `test-profile-sync-${crypto.randomUUID()}`;
    const email = `${userId}@example.com`;
    const nextEmail = `next-${userId}@example.com`;

    try {
      await db.insert(users).values({
        id: userId,
        email,
        profile: { first_name: "Ada", last_name: "Lovelace", onboarding_complete: true },
      });

      const updated = await updateProfileIdentity(db, userId, {
        first_name: "Augusta",
        last_name: "King",
        email,
      });

      expect(updated.profile.first_name).toBe("Augusta");
      expect(updated.profile.last_name).toBe("King");
      expect(updated.email).toBe(email);

      await expect(
        updateProfileIdentity(
          db,
          userId,
          {
            first_name: "Augusta",
            last_name: "King",
            email: nextEmail,
          },
          {
            syncAuthEmail: async () => {
              throw new Error("auth unavailable");
            },
          },
        ),
      ).rejects.toMatchObject({ code: "auth_email_sync_failed" });

      const reverted = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });

      expect(reverted?.email).toBe(email);
      expect(reverted?.profile.first_name).toBe("Augusta");
      expect(reverted?.profile.last_name).toBe("King");
    } finally {
      await db.delete(users).where(eq(users.id, userId));
    }
  });
});
