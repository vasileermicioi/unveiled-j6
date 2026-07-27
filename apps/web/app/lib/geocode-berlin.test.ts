import { afterEach, describe, expect, mock, test } from "bun:test";

import { geocodeBerlinAddress } from "./geocode-berlin";

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
  mock.restore();
});

describe("geocodeBerlinAddress", () => {
  test("returns null for empty address", async () => {
    expect(await geocodeBerlinAddress("   ")).toBeNull();
  });

  test("returns lat/lng from Nominatim payload", async () => {
    const fetchMock = mock(() =>
      Promise.resolve(
        new Response(JSON.stringify([{ lat: "52.520008", lon: "13.404954" }]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await geocodeBerlinAddress("Fasanenstraße 23, Berlin");
    expect(result).toEqual({ lat: 52.520008, lng: 13.404954 });
    expect(fetchMock).toHaveBeenCalled();
  });

  test("soft-fails on network error", async () => {
    globalThis.fetch = mock(() => Promise.reject(new Error("network"))) as unknown as typeof fetch;
    expect(await geocodeBerlinAddress("Somewhere Berlin")).toBeNull();
  });

  test("soft-fails on non-OK response", async () => {
    globalThis.fetch = mock(() =>
      Promise.resolve(new Response("nope", { status: 503 })),
    ) as unknown as typeof fetch;
    expect(await geocodeBerlinAddress("Somewhere Berlin")).toBeNull();
  });
});
