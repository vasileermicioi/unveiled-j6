import type { Story } from "@ladle/react";

import { AppNavbar } from "./AppNavbar";
import { mockAdminSession, mockUserSession, storyLocale, storyPathname } from "./stories/fixtures";

export const Guest: Story = () => (
  <AppNavbar locale={storyLocale} pathname={storyPathname} session={null} />
);
Guest.storyName = "AppNavbar / Guest";

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
