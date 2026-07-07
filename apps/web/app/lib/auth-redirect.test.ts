import { describe, expect, test } from "bun:test";

import { buildDefaultAuthContinuePath, normalizeAuthRedirectTarget } from "./auth-redirect";

describe("normalizeAuthRedirectTarget", () => {
  test("maps mistaken admin continue path to auth continue", () => {
    expect(normalizeAuthRedirectTarget("/en/admin/continue", "en")).toBe("/en/auth/continue");
    expect(normalizeAuthRedirectTarget("/en/admin/continue?returnTo=%2Fen%2Fadmin", "en")).toBe(
      "/en/auth/continue?returnTo=%2Fen%2Fadmin",
    );
  });

  test("accepts valid auth continue paths", () => {
    expect(normalizeAuthRedirectTarget("/de/auth/continue", "de")).toBe("/de/auth/continue");
  });

  test("rejects external and unknown paths", () => {
    expect(normalizeAuthRedirectTarget("https://evil.example/phish", "en")).toBeUndefined();
    expect(normalizeAuthRedirectTarget("/en/events", "en")).toBeUndefined();
  });
});

describe("buildDefaultAuthContinuePath", () => {
  test("builds locale-scoped auth continue path", () => {
    expect(buildDefaultAuthContinuePath("en")).toBe("/en/auth/continue");
  });
});
