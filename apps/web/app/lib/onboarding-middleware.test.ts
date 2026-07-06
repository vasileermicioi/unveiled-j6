import { describe, expect, test } from "bun:test";

import type { AppSession } from "@unveiled/auth";

import { evaluateOnboardingRedirect } from "./onboarding-middleware";

function createSession(overrides: Partial<AppSession["user"]> = {}): AppSession {
  return {
    user: {
      id: "user-1",
      email: "member@example.com",
      role: "USER",
      partnerId: null,
      credits: 17,
      onboardingComplete: false,
      profile: { onboarding_complete: false },
      behavior: {},
      ...overrides,
    },
  };
}

describe("onboarding-middleware", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalAuthUrl = process.env.AUTH_URL;

  test("evaluateOnboardingRedirect skips when auth env is missing", () => {
    process.env.DATABASE_URL = "";
    process.env.AUTH_URL = "";

    expect(
      evaluateOnboardingRedirect({
        locale: "de",
        pathname: "/de/events",
        session: createSession(),
      }),
    ).toBeNull();

    process.env.DATABASE_URL = originalDatabaseUrl;
    process.env.AUTH_URL = originalAuthUrl;
  });

  test("evaluateOnboardingRedirect blocks incomplete USER from member app prefixes", () => {
    process.env.DATABASE_URL = "postgres://example";
    process.env.AUTH_URL = "https://auth.example";

    for (const prefix of ["events", "saved", "bookings", "profile"] as const) {
      expect(
        evaluateOnboardingRedirect({
          locale: "de",
          pathname: `/de/${prefix}`,
          session: createSession(),
        }),
      ).toBe("/de/onboarding/age");
    }

    process.env.DATABASE_URL = originalDatabaseUrl;
    process.env.AUTH_URL = originalAuthUrl;
  });

  test("evaluateOnboardingRedirect blocks incomplete USER from member app prefixes in EN", () => {
    process.env.DATABASE_URL = "postgres://example";
    process.env.AUTH_URL = "https://auth.example";

    for (const prefix of ["events", "saved", "bookings", "profile"] as const) {
      expect(
        evaluateOnboardingRedirect({
          locale: "en",
          pathname: `/en/${prefix}`,
          session: createSession(),
        }),
      ).toBe("/en/onboarding/age");
    }

    process.env.DATABASE_URL = originalDatabaseUrl;
    process.env.AUTH_URL = originalAuthUrl;
  });

  test("evaluateOnboardingRedirect resumes incomplete USER at saved step", () => {
    process.env.DATABASE_URL = "postgres://example";
    process.env.AUTH_URL = "https://auth.example";

    expect(
      evaluateOnboardingRedirect({
        locale: "de",
        pathname: "/de/bookings",
        session: createSession({
          behavior: { onboarding_step: "location" },
        }),
      }),
    ).toBe("/de/onboarding/location");

    process.env.DATABASE_URL = originalDatabaseUrl;
    process.env.AUTH_URL = originalAuthUrl;
  });

  test("evaluateOnboardingRedirect allows incomplete USER on membership and marketing routes", () => {
    process.env.DATABASE_URL = "postgres://example";
    process.env.AUTH_URL = "https://auth.example";

    for (const pathname of ["/de/membership", "/de/discover", "/de/onboarding/age"] as const) {
      expect(
        evaluateOnboardingRedirect({
          locale: "de",
          pathname,
          session: createSession(),
        }),
      ).toBeNull();
    }

    process.env.DATABASE_URL = originalDatabaseUrl;
    process.env.AUTH_URL = originalAuthUrl;
  });

  test("evaluateOnboardingRedirect sends complete USER away from onboarding routes", () => {
    process.env.DATABASE_URL = "postgres://example";
    process.env.AUTH_URL = "https://auth.example";

    for (const pathname of [
      "/de/onboarding",
      "/de/onboarding/age",
      "/de/onboarding/timing",
    ] as const) {
      expect(
        evaluateOnboardingRedirect({
          locale: "de",
          pathname,
          session: createSession({
            onboardingComplete: true,
            profile: { onboarding_complete: true },
          }),
        }),
      ).toBe("/de/events");
    }

    process.env.DATABASE_URL = originalDatabaseUrl;
    process.env.AUTH_URL = originalAuthUrl;
  });

  test("evaluateOnboardingRedirect does not redirect complete USER on member app prefixes", () => {
    process.env.DATABASE_URL = "postgres://example";
    process.env.AUTH_URL = "https://auth.example";

    expect(
      evaluateOnboardingRedirect({
        locale: "de",
        pathname: "/de/events",
        session: createSession({
          onboardingComplete: true,
          profile: { onboarding_complete: true },
        }),
      }),
    ).toBeNull();

    process.env.DATABASE_URL = originalDatabaseUrl;
    process.env.AUTH_URL = originalAuthUrl;
  });

  test("evaluateOnboardingRedirect sends PARTNER away from onboarding routes only", () => {
    process.env.DATABASE_URL = "postgres://example";
    process.env.AUTH_URL = "https://auth.example";

    expect(
      evaluateOnboardingRedirect({
        locale: "de",
        pathname: "/de/onboarding/age",
        session: createSession({ role: "PARTNER" }),
      }),
    ).toBe("/de");

    expect(
      evaluateOnboardingRedirect({
        locale: "de",
        pathname: "/de/events",
        session: createSession({ role: "PARTNER" }),
      }),
    ).toBeNull();

    process.env.DATABASE_URL = originalDatabaseUrl;
    process.env.AUTH_URL = originalAuthUrl;
  });

  test("evaluateOnboardingRedirect sends ADMIN away from onboarding routes only", () => {
    process.env.DATABASE_URL = "postgres://example";
    process.env.AUTH_URL = "https://auth.example";

    expect(
      evaluateOnboardingRedirect({
        locale: "en",
        pathname: "/en/onboarding/interests",
        session: createSession({ role: "ADMIN" }),
      }),
    ).toBe("/en");

    expect(
      evaluateOnboardingRedirect({
        locale: "en",
        pathname: "/en/profile",
        session: createSession({ role: "ADMIN" }),
      }),
    ).toBeNull();

    process.env.DATABASE_URL = originalDatabaseUrl;
    process.env.AUTH_URL = originalAuthUrl;
  });
});
