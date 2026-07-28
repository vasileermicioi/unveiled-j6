/** Minimal event shape for language filter matching. */
export type LanguageFilterableEvent = {
  languageIndependent: boolean;
  languages: string[] | null;
};

/**
 * When `languageIndependent` is true, the event matches every language filter value.
 * Otherwise the event matches when its `languages` list intersects the selected codes.
 * An empty selected list means "no language filter" and matches all events.
 */
export function eventMatchesLanguageFilter(
  event: LanguageFilterableEvent,
  selectedLanguages: readonly string[],
): boolean {
  if (selectedLanguages.length === 0) {
    return true;
  }

  if (event.languageIndependent) {
    return true;
  }

  const listed = event.languages ?? [];
  return selectedLanguages.some((code) => listed.includes(code));
}

/** Domain coerce: language-independent events never store a language list. */
export function resolveEventLanguages(
  languageIndependent: boolean,
  languages: string[] | null | undefined,
): string[] | null {
  if (languageIndependent) {
    return null;
  }

  return languages ?? null;
}
