import { describe, expect, test } from "bun:test";

import {
  buildLoginRedirectUrl,
  evaluateAuthRedirect,
  isProtectedPrefix,
  isPublicEventDetailPath,
} from "./auth-middleware";

describe("auth-middleware", () => {
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalAuthUrl = process.env.AUTH_URL;

  test("isProtectedPrefix matches guarded segments", () => {
    expect(isProtectedPrefix("events")).toBe(true);
    expect(isProtectedPrefix("waitlist")).toBe(true);
    expect(isProtectedPrefix("discover")).toBe(false);
    expect(isProtectedPrefix(null)).toBe(false);
  });

  test("buildLoginRedirectUrl includes returnTo", () => {
    expect(buildLoginRedirectUrl("de", "/de/events")).toBe("/de/login?returnTo=%2Fde%2Fevents");
  });

  test("evaluateAuthRedirect sends guests to login", () => {
    process.env.DATABASE_URL = "postgres://example";
    process.env.AUTH_URL = "https://auth.example";

    expect(
      evaluateAuthRedirect({
        locale: "de",
        pathname: "/de/events",
        session: null,
      }),
    ).toBe("/de/login?returnTo=%2Fde%2Fevents");

    expect(
      evaluateAuthRedirect({
        locale: "de",
        pathname: "/de/events",
        search: "?category=Theater&page=2",
        session: null,
      }),
    ).toBe("/de/login?returnTo=%2Fde%2Fevents%3Fcategory%3DTheater%26page%3D2");

    process.env.DATABASE_URL = originalDatabaseUrl;
    process.env.AUTH_URL = originalAuthUrl;
  });

  test("isPublicEventDetailPath allows guest event detail", () => {
    expect(isPublicEventDetailPath("/de/events/abc-123", "de")).toBe(true);
    expect(isPublicEventDetailPath("/de/events", "de")).toBe(false);
    expect(isPublicEventDetailPath("/de/events/abc/book", "de")).toBe(false);
    expect(isPublicEventDetailPath("/de/events/waitlist", "de")).toBe(false);
  });

  test("evaluateAuthRedirect allows public event detail without session", () => {
    process.env.DATABASE_URL = "postgres://example";
    process.env.AUTH_URL = "https://auth.example";

    expect(
      evaluateAuthRedirect({
        locale: "de",
        pathname: "/de/events/f20ef640-5c63-4f16-9335-62277def8087",
        session: null,
      }),
    ).toBeNull();

    process.env.DATABASE_URL = originalDatabaseUrl;
    process.env.AUTH_URL = originalAuthUrl;
  });

  test("evaluateAuthRedirect allows guest save/unsave paths so handlers can redirect", () => {
    process.env.DATABASE_URL = "postgres://example";
    process.env.AUTH_URL = "https://auth.example";

    expect(
      evaluateAuthRedirect({
        locale: "de",
        pathname: "/de/events/abc-123/save",
        session: null,
      }),
    ).toBeNull();
    expect(
      evaluateAuthRedirect({
        locale: "en",
        pathname: "/en/events/abc-123/unsave",
        session: null,
      }),
    ).toBeNull();

    process.env.DATABASE_URL = originalDatabaseUrl;
    process.env.AUTH_URL = originalAuthUrl;
  });

  test("evaluateAuthRedirect blocks USER from partner prefix", () => {
    process.env.DATABASE_URL = "postgres://example";
    process.env.AUTH_URL = "https://auth.example";

    expect(
      evaluateAuthRedirect({
        locale: "de",
        pathname: "/de/partner",
        session: {
          user: {
            id: "user-1",
            email: "member@example.com",
            role: "USER",
            partnerId: null,
            credits: 17,
            onboardingComplete: false,
            profile: { onboarding_complete: false },
            behavior: {},
          },
        },
      }),
    ).toBe("/de");

    process.env.DATABASE_URL = originalDatabaseUrl;
    process.env.AUTH_URL = originalAuthUrl;
  });

  test("evaluateAuthRedirect skips when auth env is missing", () => {
    process.env.DATABASE_URL = "";
    process.env.AUTH_URL = "";

    expect(
      evaluateAuthRedirect({
        locale: "de",
        pathname: "/de/events",
        session: null,
      }),
    ).toBeNull();

    process.env.DATABASE_URL = originalDatabaseUrl;
    process.env.AUTH_URL = originalAuthUrl;
  });
});
