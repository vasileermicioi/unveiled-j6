/**
 * ISO 639-1 (alpha-2) helpers via `Intl.DisplayNames` — no npm language-data dependency.
 * Used for subtitle-language validation (broader than spoken-event allowlist).
 */

/** Retired ISO 639-1 codes that alias modern ones (same display name → duplicate UI rows). */
const DEPRECATED_ISO6391_CODES = new Set(["IN", "IW", "JI", "JW", "MO"]);

function englishLanguageDisplay(): Intl.DisplayNames {
  return new Intl.DisplayNames(["en"], { type: "language" });
}

/** True when `code` is a recognized ISO 639-1 alpha-2 language (case-insensitive). */
export function isIso6391LanguageCode(code: string): boolean {
  const normalized = code.trim().toLowerCase();
  if (!/^[a-z]{2}$/.test(normalized)) {
    return false;
  }
  const name = englishLanguageDisplay().of(normalized);
  return Boolean(name && name.toLowerCase() !== normalized);
}

/**
 * ISO 639-1 codes for subtitle UI, uppercase (e.g. `DE`, `EN`).
 * Omits deprecated aliases so labels stay unique.
 */
export function listIso6391LanguageCodes(): string[] {
  const display = englishLanguageDisplay();
  const codes: string[] = [];
  for (let i = 0; i < 26; i++) {
    for (let j = 0; j < 26; j++) {
      const code = String.fromCharCode(97 + i) + String.fromCharCode(97 + j);
      const upper = code.toUpperCase();
      if (DEPRECATED_ISO6391_CODES.has(upper)) {
        continue;
      }
      const name = display.of(code);
      if (name && name.toLowerCase() !== code) {
        codes.push(upper);
      }
    }
  }
  return codes;
}
