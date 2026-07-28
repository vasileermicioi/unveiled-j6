import { describe, expect, test } from "bun:test";

import { eventMatchesLanguageFilter, resolveEventLanguages } from "./language-filter";

describe("resolveEventLanguages", () => {
  test("forces languages null when language-independent", () => {
    expect(resolveEventLanguages(true, ["DE", "EN"])).toBeNull();
    expect(resolveEventLanguages(true, null)).toBeNull();
    expect(resolveEventLanguages(true, undefined)).toBeNull();
  });

  test("keeps array semantics when not language-independent", () => {
    expect(resolveEventLanguages(false, ["DE"])).toEqual(["DE"]);
    expect(resolveEventLanguages(false, null)).toBeNull();
    expect(resolveEventLanguages(false, undefined)).toBeNull();
  });
});

describe("eventMatchesLanguageFilter", () => {
  test("empty filter matches all events", () => {
    expect(eventMatchesLanguageFilter({ languageIndependent: false, languages: ["DE"] }, [])).toBe(
      true,
    );
    expect(eventMatchesLanguageFilter({ languageIndependent: true, languages: null }, [])).toBe(
      true,
    );
  });

  test("language-independent matches any selected language", () => {
    expect(eventMatchesLanguageFilter({ languageIndependent: true, languages: null }, ["DE"])).toBe(
      true,
    );
    expect(
      eventMatchesLanguageFilter({ languageIndependent: true, languages: ["EN"] }, ["FR"]),
    ).toBe(true);
  });

  test("non-independent requires language intersection", () => {
    expect(
      eventMatchesLanguageFilter({ languageIndependent: false, languages: ["DE", "EN"] }, ["EN"]),
    ).toBe(true);
    expect(
      eventMatchesLanguageFilter({ languageIndependent: false, languages: ["DE"] }, ["EN"]),
    ).toBe(false);
    expect(
      eventMatchesLanguageFilter({ languageIndependent: false, languages: null }, ["DE"]),
    ).toBe(false);
  });
});
