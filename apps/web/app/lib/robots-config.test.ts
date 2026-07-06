import { describe, expect, test } from "bun:test";

import { buildRobotsTxt, ROBOTS_DISALLOW_PATHS } from "./robots-config";

describe("robots-config", () => {
  test("ROBOTS_DISALLOW_PATHS includes onboarding prefix", () => {
    expect(ROBOTS_DISALLOW_PATHS).toContain("/*/onboarding/");
  });

  test("buildRobotsTxt emits Disallow lines for each path", () => {
    const body = buildRobotsTxt();

    expect(body).toContain("Disallow: /*/onboarding/");
    expect(body).toContain("User-agent: *");
    expect(body).toContain("Allow: /");
    expect(body).toContain("Sitemap:");
  });
});
