import { createRoute } from "honox/factory";

import { absoluteUrl } from "../lib/site-config";

const ROBOTS_DISALLOW_PATHS = [
  "/*/admin/",
  "/*/partner/",
  "/*/profile/",
  "/*/bookings",
  "/*/saved",
  "/*/onboarding/",
  "/*/checkin",
  "/*/events/*/book",
  "/*/events/*/waitlist",
  "/*/login",
  "/*/signup",
  "/*/forgot-password",
  "/*/reset-password",
] as const;

function buildRobotsTxt(): string {
  const lines = [
    "User-agent: *",
    "Allow: /",
    ...ROBOTS_DISALLOW_PATHS.map((path) => `Disallow: ${path}`),
    "",
    `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
  ];

  return `${lines.join("\n")}\n`;
}

export default createRoute((c) => {
  return c.text(buildRobotsTxt(), 200, {
    "Content-Type": "text/plain; charset=utf-8",
  });
});
