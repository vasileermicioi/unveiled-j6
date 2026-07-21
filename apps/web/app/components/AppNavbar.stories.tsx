import type { Story } from "@ladle/react";

import { AppNavbar } from "./AppNavbar";
import { mockAdminSession, mockUserSession, storyLocale, storyPathname } from "./stories/fixtures";

/**
 * Slim header IA (Featured Discover browse split):
 * - Guest: logo · Discover → /discover · FAQ · DE|EN · Log in
 * - Inactive USER: Discover → /discover; logo → /discover
 * - Active USER: Browse events → /events; logo → /events
 * - ADMIN: Discover + admin dashboard; logo → /admin
 */
export const Guest: Story = () => (
  <AppNavbar locale={storyLocale} pathname={storyPathname} session={null} />
);
Guest.storyName = "AppNavbar / Guest (slim header)";

export const SignedInUserInactive: Story = () => (
  <AppNavbar
    canBrowseEvents={false}
    locale={storyLocale}
    pathname={storyPathname}
    savedCount={2}
    session={mockUserSession}
  />
);
SignedInUserInactive.storyName = "AppNavbar / USER inactive (Discover)";

export const SignedInUserActive: Story = () => (
  <AppNavbar
    canBrowseEvents
    locale={storyLocale}
    pathname="/de/events"
    savedCount={2}
    session={mockUserSession}
  />
);
SignedInUserActive.storyName = "AppNavbar / USER active (Browse events)";

/** @deprecated Prefer SignedInUserInactive / SignedInUserActive */
export const SignedInUser: Story = () => (
  <AppNavbar
    canBrowseEvents={false}
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
