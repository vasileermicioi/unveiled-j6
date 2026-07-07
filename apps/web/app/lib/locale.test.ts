import { describe, expect, test } from "bun:test";

import { getRequestLocale } from "./locale";

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
