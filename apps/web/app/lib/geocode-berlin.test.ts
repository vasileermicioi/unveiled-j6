import { afterEach, describe, expect, mock, test } from "bun:test";

import { geocodeBerlinAddress } from "./geocode-berlin";

const originalFetch = globalThis.fetch;

const sampleLocation = {
  street: "Fasanenstraße",
  houseNumber: "23",
  zipCode: "10719",
  city: "berlin",
};

afterEach(() => {
  globalThis.fetch = originalFetch;
  mock.restore();
});

describe("geocodeBerlinAddress", () => {
  test("returns null when street/house/zip missing", async () => {
    expect(
      await geocodeBerlinAddress({ street: "  ", houseNumber: "1", zipCode: "10115" }),
    ).toBeNull();
    expect(
      await geocodeBerlinAddress({ street: "Torstraße", houseNumber: "", zipCode: "10115" }),
    ).toBeNull();
    expect(
      await geocodeBerlinAddress({ street: "Torstraße", houseNumber: "1", zipCode: "  " }),
    ).toBeNull();
  });

  test("uses structured Nominatim params and excludes free-text q / line2", async () => {
    let requestedUrl = "";
    const fetchMock = mock((input: RequestInfo | URL) => {
      requestedUrl = String(input);
      return Promise.resolve(
        new Response(JSON.stringify([{ lat: "52.520008", lon: "13.404954" }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await geocodeBerlinAddress({
      ...sampleLocation,
      // Callers must not pass line2; ensure API still works if only structured fields given.
    });
    expect(result).toEqual({ lat: 52.520008, lng: 13.404954 });
    expect(fetchMock).toHaveBeenCalled();

    const url = new URL(requestedUrl);
    expect(url.searchParams.get("q")).toBeNull();
    expect(url.searchParams.get("street")).toBe("23 Fasanenstraße");
    expect(url.searchParams.get("postalcode")).toBe("10719");
    expect(url.searchParams.get("city")).toBe("Berlin");
    expect(url.searchParams.get("country")).toBe("Germany");
    expect(url.searchParams.has("addressdetails")).toBe(false);
    expect(requestedUrl.includes("Hinterhaus")).toBe(false);
    expect(requestedUrl.includes("address_line2")).toBe(false);
  });

  test("soft-fails on network error", async () => {
    globalThis.fetch = mock(() => Promise.reject(new Error("network"))) as unknown as typeof fetch;
    expect(await geocodeBerlinAddress(sampleLocation)).toBeNull();
  });

  test("soft-fails on non-OK response", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response("nope", { status: 503 })),
    ) as unknown as typeof fetch;
    expect(await geocodeBerlinAddress(sampleLocation)).toBeNull();
  });

  test("soft-fails on empty Nominatim results", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    ) as unknown as typeof fetch;
    expect(await geocodeBerlinAddress(sampleLocation)).toBeNull();
  });
});
