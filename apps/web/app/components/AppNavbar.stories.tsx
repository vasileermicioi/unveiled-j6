import type { Story } from "@ladle/react";

import { AppNavbar } from "./AppNavbar";
import { mockAdminSession, mockUserSession, storyLocale, storyPathname } from "./stories/fixtures";

/**
 * Slim header IA (Simplified Header):
 * - Guest: logo · Discover (primary) · FAQ · DE|EN · Log in — no Sign up / How it works / Membership / tagline
 * - USER: same marketing nav + Saved / Bookings / credits / Profile / Logout
 * - ADMIN: same marketing nav + admin dashboard entry
 */
export const Guest: Story = () => (
  <AppNavbar locale={storyLocale} pathname={storyPathname} session={null} />
);
Guest.storyName = "AppNavbar / Guest (slim header)";

export const SignedInUser: Story = () => (
  <AppNavbar
    locale={storyLocale}
    pathname={storyPathname}
    savedCount={2}
    session={mockUserSession}
  />
);
SignedInUser.storyName = "AppNavbar / Signed-in USER";

export const Admin: Story = () => (
  <AppNavbar locale={storyLocale} pathname="/de/admin" session={mockAdminSession} />
);
Admin.storyName = "AppNavbar / ADMIN";
