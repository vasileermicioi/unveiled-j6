export type GeocodeResult = {
  lat: number;
  lng: number;
};

const BERLIN_VIEWBOX = "13.0883,52.3383,13.7611,52.6755";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const REQUEST_TIMEOUT_MS = 5_000;

/**
 * Soft-fail Berlin-biased Nominatim geocode for admin partner address prefill.
 * Returns null on empty address, network/CORS/timeout, or empty results.
 */
export async function geocodeBerlinAddress(address: string): Promise<GeocodeResult | null> {
  const query = address.trim();
  if (!query) {
    return null;
  }

  const url = new URL(NOMINATIM_URL);
  url.searchParams.set("q", query);
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
