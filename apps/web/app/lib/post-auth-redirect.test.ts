import { describe, expect, test } from "bun:test";

import type { AppSession } from "@unveiled/auth";

import { buildAuthContinueUrl, parseReturnTo, resolvePostAuthRedirect } from "./post-auth-redirect";

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

describe("post-auth-redirect", () => {
  test("parseReturnTo accepts same-locale paths and rejects open redirects", () => {
    expect(parseReturnTo("/de/events", "de")).toBe("/de/events");
    expect(parseReturnTo("https://evil.example", "de")).toBeNull();
    expect(parseReturnTo("//evil.example", "de")).toBeNull();
    expect(parseReturnTo("/en/events", "de")).toBeNull();
    expect(parseReturnTo("/de/../admin", "de")).toBeNull();
  });

  test("buildAuthContinueUrl preserves returnTo", () => {
    expect(buildAuthContinueUrl("de")).toBe("/de/auth/continue");
    expect(buildAuthContinueUrl("de", "/de/events")).toBe(
      "/de/auth/continue?returnTo=%2Fde%2Fevents",
    );
  });

  test("resolvePostAuthRedirect sends incomplete USER to onboarding", () => {
    expect(
      resolvePostAuthRedirect({
        locale: "de",
        session: createSession(),
      }),
    ).toBe("/de/onboarding/age");
  });

  test("resolvePostAuthRedirect resumes incomplete USER at saved step", () => {
    expect(
      resolvePostAuthRedirect({
        locale: "en",
        session: createSession({
          behavior: { onboarding_step: "location" },
        }),
      }),
    ).toBe("/en/onboarding/location");
  });

  test("resolvePostAuthRedirect honors membership returnTo during onboarding", () => {
    expect(
      resolvePostAuthRedirect({
        locale: "de",
        session: createSession(),
        returnTo: "/de/membership",
      }),
    ).toBe("/de/membership");
  });

  test("resolvePostAuthRedirect ignores member-app returnTo for incomplete USER", () => {
    expect(
      resolvePostAuthRedirect({
        locale: "de",
        session: createSession(),
        returnTo: "/de/events",
      }),
    ).toBe("/de/onboarding/age");
  });

  test("resolvePostAuthRedirect sends complete USER to returnTo or events feed", () => {
    expect(
      resolvePostAuthRedirect({
        locale: "de",
        session: createSession({
          onboardingComplete: true,
          profile: { onboarding_complete: true },
        }),
        returnTo: "/de/saved",
      }),
    ).toBe("/de/saved");

    expect(
      resolvePostAuthRedirect({
        locale: "de",
        session: createSession({
          onboardingComplete: true,
          profile: { onboarding_complete: true },
        }),
      }),
    ).toBe("/de/events");
  });

  test("resolvePostAuthRedirect routes PARTNER and ADMIN to role homes", () => {
    expect(
      resolvePostAuthRedirect({
        locale: "de",
        session: createSession({ role: "PARTNER" }),
      }),
    ).toBe("/de/partner");

    expect(
      resolvePostAuthRedirect({
        locale: "en",
        session: createSession({ role: "ADMIN" }),
      }),
    ).toBe("/en/admin");
  });
});
