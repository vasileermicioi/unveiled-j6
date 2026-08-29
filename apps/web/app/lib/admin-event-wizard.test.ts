import { describe, expect, test } from "bun:test";

import {
  eventAdminFormDraftId,
  eventWizardLeavingStep,
  eventWizardStepHrefs,
  eventWizardStepPath,
  parseWizardIntent,
  submitterFromSubmitEvent,
} from "./admin-event-wizard";

describe("eventAdminFormDraftId", () => {
  test("keys create and edit drafts separately", () => {
    expect(eventAdminFormDraftId({ kind: "new" })).toBe("admin-event:new");
    expect(eventAdminFormDraftId({ kind: "edit", eventId: "abc" })).toBe("admin-event:abc");
  });
});

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

describe("eventWizardLeavingStep", () => {
  test("Next to a destination validates the previous step only", () => {
    expect(eventWizardLeavingStep("next", 2)).toBe(1);
    expect(eventWizardLeavingStep("next", 3)).toBe(2);
    expect(eventWizardLeavingStep("next", 1)).toBeNull();
  });

  test("Back and persist do not validate a leaving step", () => {
    expect(eventWizardLeavingStep("back", 2)).toBeNull();
    expect(eventWizardLeavingStep("back", 1)).toBeNull();
    expect(eventWizardLeavingStep("create", 3)).toBeNull();
    expect(eventWizardLeavingStep("save", 2)).toBeNull();
  });
});

describe("submitterFromSubmitEvent", () => {
  test("returns null when the event is not a SubmitEvent", () => {
    expect(submitterFromSubmitEvent(new Event("submit"))).toBeNull();
  });
});
