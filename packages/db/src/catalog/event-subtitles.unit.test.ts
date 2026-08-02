import { describe, expect, test } from "bun:test";

import { CatalogValidationError } from "./errors";
import { resolveEventSubtitles } from "./event-subtitles";

describe("resolveEventSubtitles", () => {
  test("forces language null when subtitles off", () => {
    expect(resolveEventSubtitles(false, "DE")).toEqual({
      hasSubtitles: false,
      subtitleLanguage: null,
    });
    expect(resolveEventSubtitles(false, null)).toEqual({
      hasSubtitles: false,
      subtitleLanguage: null,
    });
    expect(resolveEventSubtitles(false, undefined)).toEqual({
      hasSubtitles: false,
      subtitleLanguage: null,
    });
  });

  test("requires ISO 639-1 language when subtitles on", () => {
    expect(resolveEventSubtitles(true, "DE")).toEqual({
      hasSubtitles: true,
      subtitleLanguage: "DE",
    });
    expect(resolveEventSubtitles(true, " en ")).toEqual({
      hasSubtitles: true,
      subtitleLanguage: "EN",
    });
    // Beyond the spoken-event allowlist (e.g. Swahili).
    expect(resolveEventSubtitles(true, "sw")).toEqual({
      hasSubtitles: true,
      subtitleLanguage: "SW",
    });

    expect(() => resolveEventSubtitles(true, null)).toThrow(CatalogValidationError);
    expect(() => resolveEventSubtitles(true, "")).toThrow(CatalogValidationError);
    expect(() => resolveEventSubtitles(true, "xx")).toThrow(CatalogValidationError);

    try {
      resolveEventSubtitles(true, "xx");
    } catch (error) {
      expect(error).toBeInstanceOf(CatalogValidationError);
      expect((error as CatalogValidationError).code).toBe("INVALID_SUBTITLE_LANGUAGE");
    }
  });
});
