import { describe, expect, test } from "bun:test";

import { getEnvVar, setRuntimeEnv } from "./runtime-env";

describe("runtime-env", () => {
  test("reads Cloudflare bindings from the runtime store", () => {
    setRuntimeEnv({
      SITE_URL: "https://unveiled-j6.deepcode.xyz",
      DATABASE_URL: "postgres://example",
    });

    expect(getEnvVar("SITE_URL")).toBe("https://unveiled-j6.deepcode.xyz");
    expect(getEnvVar("DATABASE_URL")).toBe("postgres://example");
  });

  test("normalizes SITE_URL via getSiteUrl", async () => {
    setRuntimeEnv({ SITE_URL: "https://unveiled-j6.deepcode.xyz/" });

    const { getSiteUrl } = await import("./site-config");
    expect(getSiteUrl()).toBe("https://unveiled-j6.deepcode.xyz");
  });
});
