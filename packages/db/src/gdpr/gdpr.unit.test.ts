import { describe, expect, test } from "bun:test";

import { deletedEmailPlaceholder, GdprError, isGdprError } from "./index";

describe("gdpr unit", () => {
  test("deletedEmailPlaceholder is unique per userId and has no original email", () => {
    const a = deletedEmailPlaceholder("user-a");
    const b = deletedEmailPlaceholder("user-b");
    expect(a).toBe("deleted-user-a@deleted.local");
    expect(b).toBe("deleted-user-b@deleted.local");
    expect(a).not.toBe(b);
    expect(a.includes("@example.com")).toBe(false);
  });

  test("GdprError carries typed codes", () => {
    const err = new GdprError("ALREADY_DELETED", "gone");
    expect(isGdprError(err)).toBe(true);
    expect(err.code).toBe("ALREADY_DELETED");
    expect(err.name).toBe("GdprError");
    expect(isGdprError(new Error("nope"))).toBe(false);
  });
});
