import { Heading, Surface } from "@heroui/react";
import type { Story } from "@ladle/react";

import { AppShell } from "./AppShell";
import { mockAdminSession, mockUserSession, storyLocale, storyPathname } from "./stories/fixtures";

/**
 * Full shell (navbar + footer). Guest chrome is slim; footer nav is Discover + FAQ only.
 */
export const Guest: Story = () => (
  <AppShell locale={storyLocale} pathname={storyPathname} session={null}>
    <Surface className="mx-auto max-w-7xl px-4 py-12" variant="transparent">
      <Heading level={2}>Sample page content</Heading>
    </Surface>
  </AppShell>
);
Guest.storyName = "AppShell / Guest (slim header + footer)";

export const SignedInUserInactive: Story = () => (
  <AppShell
    canBrowseEvents={false}
    locale={storyLocale}
    pathname={storyPathname}
    savedCount={3}
    session={mockUserSession}
  >
    <Surface className="mx-auto max-w-7xl px-4 py-12" variant="transparent">
      <Heading level={2}>Sample page content</Heading>
    </Surface>
  </AppShell>
);
SignedInUserInactive.storyName = "AppShell / USER inactive (Discover)";

export const SignedInUserActive: Story = () => (
  <AppShell
    canBrowseEvents
    locale={storyLocale}
    pathname="/de/events"
    savedCount={3}
    session={mockUserSession}
  >
    <Surface className="mx-auto max-w-7xl px-4 py-12" variant="transparent">
      <Heading level={2}>Sample page content</Heading>
    </Surface>
  </AppShell>
);
SignedInUserActive.storyName = "AppShell / USER active (Browse events)";

/** @deprecated Prefer SignedInUserInactive / SignedInUserActive */
export const SignedInUser: Story = () => (
  <AppShell
    canBrowseEvents={false}
    locale={storyLocale}
    pathname={storyPathname}
    savedCount={3}
    session={mockUserSession}
  >
    <Surface className="mx-auto max-w-7xl px-4 py-12" variant="transparent">
      <Heading level={2}>Sample page content</Heading>
    </Surface>
  </AppShell>
);
SignedInUser.storyName = "AppShell / Signed-in USER";

/** Optional admin shell for reviewers who want footer + admin navbar together. */
export const Admin: Story = () => (
  <AppShell locale={storyLocale} pathname="/de/admin" session={mockAdminSession}>
    <Surface className="mx-auto max-w-7xl px-4 py-12" variant="transparent">
      <Heading level={2}>Sample admin content</Heading>
    </Surface>
  </AppShell>
);
Admin.storyName = "AppShell / ADMIN";
