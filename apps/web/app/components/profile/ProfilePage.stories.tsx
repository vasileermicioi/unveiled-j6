import type { Story } from "@ladle/react";

import { getProfileCopy } from "../../lib/profile-content";
import { mockProfile, mockUserSession, storyLocale } from "../stories/fixtures";
import { ProfilePage } from "./ProfilePage";

const copy = getProfileCopy(storyLocale);
const { user } = mockUserSession;

export const Default: Story = () => (
  <ProfilePage
    copy={copy}
    credits={user.credits}
    email={user.email}
    firstName={mockProfile.first_name ?? "Alex"}
    lastName={mockProfile.last_name ?? "Berlin"}
    locale={storyLocale}
  />
);
Default.storyName = "ProfilePage / Default";

export const Saved: Story = () => (
  <ProfilePage
    copy={copy}
    credits={user.credits}
    email={user.email}
    firstName={mockProfile.first_name ?? "Alex"}
    lastName={mockProfile.last_name ?? "Berlin"}
    locale={storyLocale}
    success={copy.successIdentity}
  />
);
Saved.storyName = "ProfilePage / Saved";
