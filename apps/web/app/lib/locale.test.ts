import { describe, expect, test } from "bun:test";

import {
  collapseDuplicateLocalePrefix,
  getRequestLocale,
  isAuthPage,
  unprefixedAuthRedirectPath,
} from "./locale";

describe("collapseDuplicateLocalePrefix", () => {
  test("collapses doubled locale on reset-password and keeps the token query", () => {
    expect(collapseDuplicateLocalePrefix("/en/en/reset-password", "?token=abc")).toBe(
      "/en/reset-password?token=abc",
    );
    expect(collapseDuplicateLocalePrefix("/de/de/reset-password")).toBe("/de/reset-password");
  });

  test("leaves valid single-locale paths unchanged", () => {
    expect(collapseDuplicateLocalePrefix("/en/reset-password", "?token=abc")).toBeNull();
    expect(collapseDuplicateLocalePrefix("/de/events")).toBeNull();
  });
});

describe("unprefixedAuthRedirectPath", () => {
  test("localizes bare auth utility paths and keeps the query string", () => {
    expect(unprefixedAuthRedirectPath("/reset-password", "?token=abc", "en")).toBe(
      "/en/reset-password?token=abc",
    );
    expect(unprefixedAuthRedirectPath("/reset-link-sent", "", "de")).toBe("/de/reset-link-sent");
  });

  test("ignores non-auth and already-localized paths", () => {
    expect(unprefixedAuthRedirectPath("/events", "", "en")).toBeNull();
    expect(unprefixedAuthRedirectPath("/en/login", "", "en")).toBeNull();
  });
});

describe("isAuthPage", () => {
  test("treats password-reset confirmation as an auth page", () => {
    expect(isAuthPage("/en/reset-link-sent")).toBe(true);
    expect(isAuthPage("/de/forgot-password")).toBe(true);
    expect(isAuthPage("/en/events")).toBe(false);
  });
});

describe("getRequestLocale", () => {
  test("prefers locale route param when present", () => {
    expect(
      getRequestLocale({
        req: {
          param: () => "en",
          url: "http://localhost:5174/de/admin",
        },
      }),
    ).toBe("en");
  });

  test("falls back to pathname locale when param is missing", () => {
    expect(
      getRequestLocale({
        req: {
          param: () => undefined,
          url: "http://localhost:5174/en/admin",
        },
      }),
    ).toBe("en");
  });

  test("defaults to de when locale cannot be resolved", () => {
    expect(
      getRequestLocale({
        req: {
          param: () => undefined,
          url: "http://localhost:5174/robots.txt",
        },
      }),
    ).toBe("de");
  });
});
