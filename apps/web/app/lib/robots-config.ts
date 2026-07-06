import { absoluteUrl } from "./site-config";

export const ROBOTS_DISALLOW_PATHS = [
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

export function buildRobotsTxt(): string {
  const lines = [
    "User-agent: *",
    "Allow: /",
    ...ROBOTS_DISALLOW_PATHS.map((path) => `Disallow: ${path}`),
    "",
    `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
  ];

  return `${lines.join("\n")}\n`;
}
