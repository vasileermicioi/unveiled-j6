/**
 * City-scoped postal validation.
 *
 * Registry shape is intentional: only `(DE, berlin)` is registered for this release.
 * Berlin membership uses documented PLZ ranges (10115–14199), not a bare format check
 * and not a global “any German PLZ” rule. A discrete allowlist Set can replace ranges later
 * without changing `validatePostalCode`.
 */

export const DEFAULT_LOCATION_COUNTRY = "DE";
export const DEFAULT_LOCATION_CITY = "berlin";

export type PostalValidationErrorCode =
  | "MISSING_POSTAL_CODE"
  | "INVALID_POSTAL_CODE"
  | "UNSUPPORTED_LOCATION";

export class PostalValidationError extends Error {
  readonly code: PostalValidationErrorCode;

  constructor(code: PostalValidationErrorCode, message: string) {
    super(message);
    this.name = "PostalValidationError";
    this.code = code;
  }
}

export type ValidatePostalCodeInput = {
  country?: string | null;
  city?: string | null;
  zipCode?: string | null;
};

export type NormalizedLocation = {
  country: string;
  city: string;
  zipCode: string;
};

type PostalRange = { min: number; max: number };

type CityPostalRules = {
  format: RegExp;
  ranges: readonly PostalRange[];
};

/** Inclusive integer ranges covering Berlin’s PLZ band (MVP membership check). */
const BERLIN_PLZ_RANGES: readonly PostalRange[] = [{ min: 10115, max: 14199 }];

const POSTAL_REGISTRY: Record<string, CityPostalRules> = {
  "DE:berlin": {
    format: /^\d{5}$/,
    ranges: BERLIN_PLZ_RANGES,
  },
};

function registryKey(country: string, city: string): string {
  return `${country}:${city}`;
}

function normalizeCountry(country: string | null | undefined): string {
  const trimmed = (country ?? DEFAULT_LOCATION_COUNTRY).trim();
  return trimmed.length > 0 ? trimmed.toUpperCase() : DEFAULT_LOCATION_COUNTRY;
}

function normalizeCity(city: string | null | undefined): string {
  const trimmed = (city ?? DEFAULT_LOCATION_CITY).trim();
  return trimmed.length > 0 ? trimmed.toLowerCase() : DEFAULT_LOCATION_CITY;
}

function isInRanges(value: number, ranges: readonly PostalRange[]): boolean {
  return ranges.some((range) => value >= range.min && value <= range.max);
}

/**
 * Validates and normalizes a location postal code against the city registry.
 * Omitted/blank country or city default to `DE` / `berlin` before lookup.
 * Explicit unsupported pairs fail closed.
 */
export function validatePostalCode(input: ValidatePostalCodeInput): NormalizedLocation {
  const country = normalizeCountry(input.country);
  const city = normalizeCity(input.city);
  const zipCode = (input.zipCode ?? "").trim();

  if (!zipCode) {
    throw new PostalValidationError("MISSING_POSTAL_CODE", "zip_code is required");
  }

  const rules = POSTAL_REGISTRY[registryKey(country, city)];
  if (!rules) {
    throw new PostalValidationError(
      "UNSUPPORTED_LOCATION",
      `Unsupported location: country=${country}, city=${city}`,
    );
  }

  if (!rules.format.test(zipCode) || !isInRanges(Number(zipCode), rules.ranges)) {
    throw new PostalValidationError(
      "INVALID_POSTAL_CODE",
      `Invalid postal code for ${country}/${city}: ${zipCode}`,
    );
  }

  return { country, city, zipCode };
}

/** True when `(country, city)` is registered (after normalization defaults). */
export function isSupportedLocation(country?: string | null, city?: string | null): boolean {
  const key = registryKey(normalizeCountry(country), normalizeCity(city));
  return key in POSTAL_REGISTRY;
}
