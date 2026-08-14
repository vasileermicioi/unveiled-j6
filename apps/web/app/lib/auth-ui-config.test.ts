import { describe, expect, test } from "bun:test";
import { getViewURL } from "@better-auth-ui/core";

import { createAuthProviderConfig } from "./auth-ui-config";

describe("createAuthProviderConfig", () => {
  test("password reset email URL has a single locale prefix", () => {
    const config = createAuthProviderConfig("en");
    const baseURL = "https://unveiled-j6.deepcode.xyz/en";

    expect(getViewURL(baseURL, config.basePaths.auth, config.viewPaths.auth.resetPassword)).toBe(
      "https://unveiled-j6.deepcode.xyz/en/reset-password",
    );
    expect(config.viewPaths.auth.resetLinkSent).toBe("reset-link-sent");
  });

  test("German auth base stays locale-relative for in-app navigation", () => {
    const config = createAuthProviderConfig("de");
    expect(config.basePaths.auth).toBe("");
    expect(
      getViewURL(
        "https://example.com/de",
        config.basePaths.auth,
        config.viewPaths.auth.forgotPassword,
      ),
    ).toBe("https://example.com/de/forgot-password");
  });
});
