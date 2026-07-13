import type { Story } from "@ladle/react";

import { getProfileCopy } from "../../lib/profile-content";
import { mockProfile, storyLocale } from "../stories/fixtures";
import { PreferencesPage } from "./PreferencesPage";

const copy = getProfileCopy(storyLocale);

export const Default: Story = () => (
  <PreferencesPage copy={copy} locale={storyLocale} profile={mockProfile} />
);
Default.storyName = "PreferencesPage / Default";

export const Saved: Story = () => (
  <PreferencesPage
    copy={copy}
    locale={storyLocale}
    profile={mockProfile}
    success={copy.successPreferences}
  />
);
Saved.storyName = "PreferencesPage / Saved";

export const ValidationError: Story = () => (
  <PreferencesPage
    copy={copy}
    error={copy.validationError}
    locale={storyLocale}
    profile={mockProfile}
  />
);
ValidationError.storyName = "PreferencesPage / Validation error";
