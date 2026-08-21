import { describe, expect, test } from "bun:test";

import {
  createDraftPayload,
  type DraftStorage,
  discardDraftNavigation,
  draftStorageKey,
  FORM_DRAFT_TTL_MS,
  type NamedFieldSnapshot,
  parseDraft,
  readStoredDraft,
  restoreNamedField,
  serializeNamedFields,
  shouldSkipNamedField,
  writeStoredDraft,
} from "./form-draft";

function memoryStorage(initial: Record<string, string> = {}): DraftStorage & {
  data: Record<string, string>;
} {
  const data = { ...initial };
  return {
    data,
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value;
    },
    removeItem: (key) => {
      delete data[key];
    },
  };
}

const titleField: NamedFieldSnapshot = { name: "title", type: "text", value: "Poetry Night" };
const languagesEn: NamedFieldSnapshot = {
  name: "languages",
  type: "checkbox",
  value: "EN",
  checked: true,
};
const languagesDe: NamedFieldSnapshot = {
  name: "languages",
  type: "checkbox",
  value: "DE",
  checked: true,
};
const languagesFrOff: NamedFieldSnapshot = {
  name: "languages",
  type: "checkbox",
  value: "FR",
  checked: false,
};
const fileField: NamedFieldSnapshot = { name: "image", type: "file", value: "poster.jpg" };
const wizardIntent: NamedFieldSnapshot = { name: "wizard_intent", type: "submit", value: "next" };
const unnamed: NamedFieldSnapshot = { name: "", type: "text", value: "x" };

describe("draftStorageKey", () => {
  test("uses the versioned prefix and form id", () => {
    expect(draftStorageKey("admin-event:new")).toBe("unveiled:form-draft:v1:admin-event:new");
    expect(draftStorageKey("admin-event:new")).not.toBe("unveiled:cookie-consent");
  });
});

describe("shouldSkipNamedField", () => {
  test("skips file, wizard_intent, submit, and nameless fields", () => {
    expect(shouldSkipNamedField("image", "file")).toBe(true);
    expect(shouldSkipNamedField("wizard_intent", "submit")).toBe(true);
    expect(shouldSkipNamedField("wizard_intent", "hidden")).toBe(true);
    expect(shouldSkipNamedField("", "text")).toBe(true);
    expect(shouldSkipNamedField("save", "submit")).toBe(true);
    expect(shouldSkipNamedField("title", "text")).toBe(false);
  });
});

describe("serializeNamedFields", () => {
  test("serializes strings, string arrays, and checkbox on/off", () => {
    const fields = serializeNamedFields([
      titleField,
      languagesEn,
      languagesDe,
      languagesFrOff,
      fileField,
      wizardIntent,
      unnamed,
    ]);
    expect(fields.title).toBe("Poetry Night");
    expect(fields.languages).toEqual(["EN", "DE"]);
    expect(fields).not.toHaveProperty("image");
    expect(fields).not.toHaveProperty("wizard_intent");
    expect(fields).not.toHaveProperty("");
  });

  test("omits unchecked checkboxes so restore can turn them off", () => {
    const fields = serializeNamedFields([languagesFrOff]);
    expect(fields).toEqual({});
  });
});

describe("restoreNamedField", () => {
  test("restores text and checkbox group from the field map", () => {
    const fields = serializeNamedFields([titleField, languagesEn, languagesDe]);
    expect(restoreNamedField({ name: "title", type: "text", value: "Old" }, fields)).toEqual({
      name: "title",
      type: "text",
      value: "Poetry Night",
    });
    expect(
      restoreNamedField(
        { name: "languages", type: "checkbox", value: "EN", checked: false },
        fields,
      )?.checked,
    ).toBe(true);
    expect(
      restoreNamedField({ name: "languages", type: "checkbox", value: "FR", checked: true }, fields)
        ?.checked,
    ).toBe(false);
  });

  test("skips file and wizard_intent on restore", () => {
    const fields = { image: "nope", wizard_intent: "create", title: "Kept" };
    expect(restoreNamedField(fileField, fields)).toBeNull();
    expect(restoreNamedField(wizardIntent, fields)).toBeNull();
    expect(restoreNamedField({ name: "title", type: "text", value: "" }, fields)?.value).toBe(
      "Kept",
    );
  });
});

describe("parseDraft", () => {
  test("returns a fresh payload and null for expired or malformed JSON", () => {
    const now = 1_700_000_000_000;
    const fresh = JSON.stringify(createDraftPayload({ title: "Live" }, now));
    expect(parseDraft(fresh, now)?.fields).toEqual({ title: "Live" });
    expect(parseDraft(fresh, now + FORM_DRAFT_TTL_MS + 1)).toBeNull();
    expect(parseDraft("{not-json}", now)).toBeNull();
    expect(parseDraft(JSON.stringify({ v: 99, savedAt: now, fields: {} }), now)).toBeNull();
    expect(parseDraft(JSON.stringify({ v: 1, savedAt: now }), now)).toBeNull();
    expect(parseDraft(null, now)).toBeNull();
  });
});

describe("readStoredDraft", () => {
  test("deletes expired and malformed keys", () => {
    const now = 1_700_000_000_000;
    const key = draftStorageKey("admin-event:abc");
    const expired = memoryStorage({
      [key]: JSON.stringify(createDraftPayload({ title: "Stale" }, now - FORM_DRAFT_TTL_MS - 1)),
    });
    expect(readStoredDraft(expired, "admin-event:abc", now)).toBeNull();
    expect(expired.data[key]).toBeUndefined();

    const malformed = memoryStorage({ [key]: "{bad" });
    expect(readStoredDraft(malformed, "admin-event:abc", now)).toBeNull();
    expect(malformed.data[key]).toBeUndefined();
  });

  test("writeStoredDraft swallows storage errors", () => {
    const throwing: DraftStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("QuotaExceededError");
      },
      removeItem: () => undefined,
    };
    expect(() => writeStoredDraft(throwing, "admin-event:new", { title: "x" })).not.toThrow();
  });

  test("discardDraftNavigation reloads when href is missing or same path", () => {
    expect(discardDraftNavigation("/en/admin/events/new", "", undefined)).toEqual({
      kind: "reload",
    });
    expect(discardDraftNavigation("/en/admin/events/new/", "", "/en/admin/events/new")).toEqual({
      kind: "reload",
    });
  });

  test("discardDraftNavigation assigns wizard step 1 from later create steps", () => {
    expect(
      discardDraftNavigation("/en/admin/events/new/dates", "", "/en/admin/events/new"),
    ).toEqual({ kind: "assign", href: "/en/admin/events/new" });
    expect(
      discardDraftNavigation("/en/admin/events/new/image", "", "/en/admin/events/new"),
    ).toEqual({ kind: "assign", href: "/en/admin/events/new" });
  });
});
