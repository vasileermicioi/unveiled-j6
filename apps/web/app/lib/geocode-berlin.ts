export type GeocodeResult = {
  lat: number;
  lng: number;
};

/** Structured Berlin location for Nominatim (address_line2 intentionally omitted). */
export type StructuredBerlinLocation = {
  street: string;
  houseNumber: string;
  zipCode: string;
  /** Canonical city key; defaults to berlin. */
  city?: string | null;
  country?: string | null;
};

const BERLIN_VIEWBOX = "13.0883,52.3383,13.7611,52.6755";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const REQUEST_TIMEOUT_MS = 5_000;

function cityDisplayLabel(city: string | null | undefined): string {
  const key = (city ?? "berlin").trim().toLowerCase() || "berlin";
  return key === "berlin" ? "Berlin" : key;
}

/**
 * Soft-fail Berlin-biased Nominatim **structured** geocode for admin location preview.
 * Does not accept or send address_line2. Returns null on empty required fields,
 * network/CORS/timeout, or empty results. Never invents default-center coordinates.
 */
export async function geocodeBerlinAddress(
  location: StructuredBerlinLocation,
): Promise<GeocodeResult | null> {
  const street = location.street.trim();
  const houseNumber = location.houseNumber.trim();
  const zipCode = location.zipCode.trim();
  if (!street || !houseNumber || !zipCode) {
    return null;
  }

  const url = new URL(NOMINATIM_URL);
  // Nominatim structured search: street = "<housenumber> <street>"
  url.searchParams.set("street", `${houseNumber} ${street}`);
  url.searchParams.set("city", cityDisplayLabel(location.city));
  url.searchParams.set("postalcode", zipCode);
  url.searchParams.set("country", "Germany");
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("countrycodes", "de");
  url.searchParams.set("viewbox", BERLIN_VIEWBOX);
  url.searchParams.set("bounded", "0");

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url.toString(), {
      headers: {
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as Array<{ lat?: string; lon?: string }>;
    const first = payload[0];
    if (!first?.lat || !first?.lon) {
      return null;
    }

    const lat = Number.parseFloat(first.lat);
    const lng = Number.parseFloat(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
      return null;
    }

    return { lat, lng };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
