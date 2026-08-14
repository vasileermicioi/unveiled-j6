import { describe, expect, test } from "bun:test";

import { eventWizardStepHrefs, eventWizardStepPath, parseWizardIntent } from "./admin-event-wizard";

describe("eventWizardStepPath", () => {
  test("maps create and edit steps onto dedicated URLs", () => {
    expect(eventWizardStepPath("en", { kind: "new" }, 1)).toBe("/en/admin/events/new");
    expect(eventWizardStepPath("en", { kind: "new" }, 2)).toBe("/en/admin/events/new/dates");
    expect(eventWizardStepPath("en", { kind: "new" }, 3)).toBe("/en/admin/events/new/image");
    expect(eventWizardStepPath("de", { kind: "edit", eventId: "abc" }, 1)).toBe(
      "/de/admin/events/abc/edit",
    );
    expect(eventWizardStepPath("de", { kind: "edit", eventId: "abc" }, 2)).toBe(
      "/de/admin/events/abc/edit/dates",
    );
    expect(eventWizardStepPath("de", { kind: "edit", eventId: "abc" }, 3)).toBe(
      "/de/admin/events/abc/edit/image",
    );
  });
});

describe("eventWizardStepHrefs", () => {
  test("returns all three create hrefs", () => {
    expect(eventWizardStepHrefs("en", { kind: "new" })).toEqual({
      1: "/en/admin/events/new",
      2: "/en/admin/events/new/dates",
      3: "/en/admin/events/new/image",
    });
  });
});

describe("parseWizardIntent", () => {
  test("maps known intents and defaults to save", () => {
    expect(parseWizardIntent("next")).toBe("next");
    expect(parseWizardIntent("back")).toBe("back");
    expect(parseWizardIntent("create")).toBe("create");
    expect(parseWizardIntent("save")).toBe("save");
    expect(parseWizardIntent(undefined)).toBe("save");
  });
});
