import { describe, expect, test } from "bun:test";

import { parseAgePayload } from "./onboarding-route";

describe("parseAgePayload", () => {
  test("treats Next without an age group as skip", () => {
    expect(parseAgePayload({})).toEqual({ skip: true });
    expect(parseAgePayload({ age_group: "" })).toEqual({ skip: true });
    expect(parseAgePayload({ age_group: "   " })).toEqual({ skip: true });
  });

  test("keeps explicit skip even when an age group is also present", () => {
    expect(parseAgePayload({ action: "skip", age_group: "26-35" })).toEqual({ skip: true });
  });

  test("stores a selected age group", () => {
    expect(parseAgePayload({ age_group: "26-35" })).toEqual({ age_group: "26-35" });
  });
});
