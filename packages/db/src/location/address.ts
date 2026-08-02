/**
 * Compose a display address from structured location fields.
 * Format: `{street} {houseNumber}[, {line2}], {zipCode} Berlin`
 * (`Berlin` is the display label for city key `berlin` in this release.)
 */

export type ComposeDisplayAddressInput = {
  street: string;
  houseNumber: string;
  addressLine2?: string | null;
  zipCode: string;
  /** Canonical city key; only `berlin` is supported for display labeling in this release. */
  city?: string | null;
};

const CITY_DISPLAY_LABELS: Record<string, string> = {
  berlin: "Berlin",
};

function cityDisplayLabel(city: string | null | undefined): string {
  const key = (city ?? "berlin").trim().toLowerCase() || "berlin";
  return CITY_DISPLAY_LABELS[key] ?? key;
}

/**
 * Builds the persisted display `address` string from structured parts.
 * Caller is responsible for validating non-empty street/house/zip before write.
 */
export function composeDisplayAddress(input: ComposeDisplayAddressInput): string {
  const street = input.street.trim();
  const houseNumber = input.houseNumber.trim();
  const line2 = input.addressLine2?.trim() ?? "";
  const zipCode = input.zipCode.trim();
  const cityLabel = cityDisplayLabel(input.city);

  const streetLine = [street, houseNumber].filter((part) => part.length > 0).join(" ");
  const parts = [streetLine];
  if (line2.length > 0) {
    parts.push(line2);
  }
  parts.push(`${zipCode} ${cityLabel}`.trim());
  return parts.filter((part) => part.length > 0).join(", ");
}

/**
 * Best-effort parse of a historical free-text Berlin address into structured parts.
 * Used by migration/backfill helpers and seed bridging — not a public geocoder.
 */
export type ParsedLegacyAddress = {
  street: string;
  houseNumber: string;
  addressLine2: string | null;
  zipCode: string | null;
};

const HOUSE_NUMBER_RE = /^(.+?)\s+(\d+[a-zA-Z]?(?:\s*[-/]\s*\d+[a-zA-Z]?)?)\s*$/;
const ZIP_IN_TEXT_RE = /\b(1[0-4]\d{3})\b/;

export function parseLegacyAddress(address: string): ParsedLegacyAddress {
  const trimmed = address.trim();
  if (!trimmed) {
    return { street: "Unknown", houseNumber: "1", addressLine2: null, zipCode: null };
  }

  const zipMatch = trimmed.match(ZIP_IN_TEXT_RE);
  const zipCode = zipMatch?.[1] ?? null;

  // Strip trailing ", 12345 Berlin" / ", Berlin" style suffixes for street parsing.
  let remainder = trimmed
    .replace(/,?\s*1[0-4]\d{3}\s*Berlin\s*$/i, "")
    .replace(/,?\s*Berlin\s*$/i, "")
    .trim();

  if (!remainder) {
    remainder = trimmed;
  }

  // Optional line2 after first comma (e.g. "Hauptstr. 1, Hinterhaus").
  let addressLine2: string | null = null;
  const commaIdx = remainder.indexOf(",");
  if (commaIdx >= 0) {
    const after = remainder.slice(commaIdx + 1).trim();
    remainder = remainder.slice(0, commaIdx).trim();
    if (after.length > 0 && !ZIP_IN_TEXT_RE.test(after) && !/^berlin$/i.test(after)) {
      addressLine2 = after;
    }
  }

  const houseMatch = remainder.match(HOUSE_NUMBER_RE);
  if (houseMatch?.[1] && houseMatch[2]) {
    return {
      street: houseMatch[1].trim(),
      houseNumber: houseMatch[2].replace(/\s+/g, "").trim(),
      addressLine2,
      zipCode,
    };
  }

  return {
    street: remainder || trimmed,
    houseNumber: "1",
    addressLine2,
    zipCode,
  };
}
