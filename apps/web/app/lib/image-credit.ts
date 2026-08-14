/** Trimmed credit for display; empty/`NULL` → omit. */
export function normalizeImageCredit(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

/** Native `title` tooltip on `<img>`s; omit when there is no credit. */
export function imageCreditTitle(value: string | null | undefined): string | undefined {
  return normalizeImageCredit(value) ?? undefined;
}

/**
 * Append stored credit to a base `alt` (e.g. event title, partner name, “Photo 1”).
 * Empty credit leaves `baseAlt` unchanged; empty base with a credit uses the credit alone.
 */
export function imageAltWithCredit(baseAlt: string, credit: string | null | undefined): string {
  const normalized = normalizeImageCredit(credit);
  const base = baseAlt.trim();
  if (!normalized) {
    return base;
  }
  return base ? `${base} (${normalized})` : normalized;
}
