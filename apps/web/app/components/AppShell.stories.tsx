import { Heading, Surface } from "@heroui/react";
import type { Story } from "@ladle/react";

import { AppShell } from "./AppShell";
import { mockUserSession, storyLocale, storyPathname } from "./stories/fixtures";

export const Guest: Story = () => (
  <AppShell locale={storyLocale} pathname={storyPathname} session={null}>
    <Surface className="mx-auto max-w-3xl px-4 py-12" variant="transparent">
      <Heading level={2}>Sample page content</Heading>
    </Surface>
  </AppShell>
);
Guest.storyName = "AppShell / Guest";

export const SignedInUser: Story = () => (
  <AppShell locale={storyLocale} pathname={storyPathname} session={mockUserSession}>
    <Surface className="mx-auto max-w-3xl px-4 py-12" variant="transparent">
      <Heading level={2}>Sample page content</Heading>
    </Surface>
  </AppShell>
);
SignedInUser.storyName = "AppShell / Signed-in USER";
