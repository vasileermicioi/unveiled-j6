import { describe, expect, test } from "bun:test";

import { CatalogValidationError } from "./errors";
import { resolveEventSubtitles } from "./event-subtitles";

describe("resolveEventSubtitles", () => {
  test("forces languages null when subtitles off", () => {
    expect(resolveEventSubtitles(false, "DE")).toEqual({
      hasSubtitles: false,
      subtitleLanguages: null,
    });
    expect(resolveEventSubtitles(false, ["DE", "EN"])).toEqual({
      hasSubtitles: false,
      subtitleLanguages: null,
    });
    expect(resolveEventSubtitles(false, null)).toEqual({
      hasSubtitles: false,
      subtitleLanguages: null,
    });
    expect(resolveEventSubtitles(false, undefined)).toEqual({
      hasSubtitles: false,
      subtitleLanguages: null,
    });
  });

  test("requires ISO 639-1 languages when subtitles on", () => {
    expect(resolveEventSubtitles(true, "DE")).toEqual({
      hasSubtitles: true,
      subtitleLanguages: ["DE"],
    });
    expect(resolveEventSubtitles(true, [" en "])).toEqual({
      hasSubtitles: true,
      subtitleLanguages: ["EN"],
    });
    expect(resolveEventSubtitles(true, " en ")).toEqual({
      hasSubtitles: true,
      subtitleLanguages: ["EN"],
    });
    // Beyond the spoken-event allowlist (e.g. Swahili).
    expect(resolveEventSubtitles(true, ["SW"])).toEqual({
      hasSubtitles: true,
      subtitleLanguages: ["SW"],
    });
    expect(resolveEventSubtitles(true, "sw")).toEqual({
      hasSubtitles: true,
      subtitleLanguages: ["SW"],
    });

    expect(() => resolveEventSubtitles(true, null)).toThrow(CatalogValidationError);
    expect(() => resolveEventSubtitles(true, [])).toThrow(CatalogValidationError);
    expect(() => resolveEventSubtitles(true, "")).toThrow(CatalogValidationError);
    expect(() => resolveEventSubtitles(true, "xx")).toThrow(CatalogValidationError);
    expect(() => resolveEventSubtitles(true, ["xx"])).toThrow(CatalogValidationError);

    try {
      resolveEventSubtitles(true, "xx");
    } catch (error) {
      expect(error).toBeInstanceOf(CatalogValidationError);
      expect((error as CatalogValidationError).code).toBe("INVALID_SUBTITLE_LANGUAGE");
    }
  });

  test("collapses duplicate codes case-insensitively in first-seen order", () => {
    expect(resolveEventSubtitles(true, ["en", "DE", "EN"])).toEqual({
      hasSubtitles: true,
      subtitleLanguages: ["EN", "DE"],
    });
  });
});
