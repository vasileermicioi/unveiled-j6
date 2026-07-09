import { describe, expect, test } from "bun:test";

import { resolvePostMutationRedirect, safeReturnTo } from "./saved-events";

describe("safeReturnTo", () => {
  test("accepts same-locale relative paths with query", () => {
    expect(safeReturnTo("de", "/de/events?page=2")).toBe("/de/events?page=2");
    expect(safeReturnTo("en", "/en/saved")).toBe("/en/saved");
    expect(safeReturnTo("de", "/de")).toBe("/de");
  });

  test("rejects other locales, protocol-relative, and bare paths", () => {
    expect(safeReturnTo("de", "/en/events")).toBeNull();
    expect(safeReturnTo("de", "//evil.example/de/events")).toBeNull();
    expect(safeReturnTo("de", "events")).toBeNull();
    expect(safeReturnTo("de", "")).toBeNull();
    expect(safeReturnTo("de", null)).toBeNull();
  });

  test("accepts absolute same-path URLs by stripping origin", () => {
    expect(safeReturnTo("de", "https://example.com/de/events?from=2026-07-09")).toBe(
      "/de/events?from=2026-07-09",
    );
    expect(safeReturnTo("de", "https://example.com/en/events")).toBeNull();
  });
});

describe("resolvePostMutationRedirect", () => {
  test("prefers form returnTo over referer and fallback", () => {
    expect(
      resolvePostMutationRedirect("de", {
        formReturnTo: "/de/saved",
        referer: "https://example.com/de/events",
        fallback: "/de/events",
      }),
    ).toBe("/de/saved");
  });

  test("falls back to referer then default", () => {
    expect(
      resolvePostMutationRedirect("en", {
        formReturnTo: "//evil",
        referer: "https://example.com/en/events?page=1",
      }),
    ).toBe("/en/events?page=1");

    expect(
      resolvePostMutationRedirect("en", {
        formReturnTo: null,
        referer: "https://other.com/en/events",
      }),
    ).toBe("/en/events");
  });
});
