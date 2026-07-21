import type { Story } from "@ladle/react";

import { getProfileCopy } from "../../lib/profile-content";
import { mockProfile, mockUserSession, storyLocale } from "../stories/fixtures";
import { ProfileDetailsPage } from "./ProfileDetailsPage";

const copy = getProfileCopy(storyLocale);
const { user } = mockUserSession;

export const Default: Story = () => (
  <ProfileDetailsPage
    copy={copy}
    email={user.email}
    firstName={mockProfile.first_name ?? "Alex"}
    lastName={mockProfile.last_name ?? "Berlin"}
    locale={storyLocale}
  />
);
Default.storyName = "ProfileDetailsPage / Default";

export const Saved: Story = () => (
  <ProfileDetailsPage
    copy={copy}
    email={user.email}
    firstName={mockProfile.first_name ?? "Alex"}
    lastName={mockProfile.last_name ?? "Berlin"}
    locale={storyLocale}
    success={copy.successIdentity}
  />
);
Saved.storyName = "ProfileDetailsPage / Saved";
