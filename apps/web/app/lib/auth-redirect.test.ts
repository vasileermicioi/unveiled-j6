import { describe, expect, test } from "bun:test";

import {
  buildAuthUiContinuePath,
  buildDefaultAuthContinuePath,
  normalizeAuthRedirectTarget,
  resolveAuthNavigatePath,
} from "./auth-redirect";

describe("normalizeAuthRedirectTarget", () => {
  test("maps mistaken admin continue path to locale-relative auth continue", () => {
    expect(normalizeAuthRedirectTarget("/en/admin/continue", "en")).toBe("/auth/continue");
    expect(normalizeAuthRedirectTarget("/en/admin/continue?returnTo=%2Fen%2Fadmin", "en")).toBe(
      "/auth/continue?returnTo=%2Fen%2Fadmin",
    );
  });

  test("accepts locale-prefixed and locale-relative auth continue paths", () => {
    expect(normalizeAuthRedirectTarget("/de/auth/continue", "de")).toBe("/auth/continue");
    expect(normalizeAuthRedirectTarget("/auth/continue", "de")).toBe("/auth/continue");
    expect(normalizeAuthRedirectTarget("/en/auth/continue?returnTo=%2Fen%2Fevents", "en")).toBe(
      "/auth/continue?returnTo=%2Fen%2Fevents",
    );
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

describe("buildAuthUiContinuePath", () => {
  test("builds locale-relative continue for AuthProvider / OAuth callbackURL", () => {
    expect(buildAuthUiContinuePath()).toBe("/auth/continue");
    expect(buildAuthUiContinuePath("/en/events/abc/book?qty=1")).toBe(
      "/auth/continue?returnTo=%2Fen%2Fevents%2Fabc%2Fbook%3Fqty%3D1",
    );
  });
});

describe("resolveAuthNavigatePath", () => {
  test("prefixes locale onto locale-relative auth continue", () => {
    expect(resolveAuthNavigatePath("/auth/continue", "en")).toBe("/en/auth/continue");
    expect(resolveAuthNavigatePath("/auth/continue?returnTo=%2Fen%2Fbookings", "en")).toBe(
      "/en/auth/continue?returnTo=%2Fen%2Fbookings",
    );
  });

  test("keeps already locale-scoped paths", () => {
    expect(resolveAuthNavigatePath("/de/auth/continue", "de")).toBe("/de/auth/continue");
    expect(resolveAuthNavigatePath("/de/events", "de")).toBe("/de/events");
  });
});
