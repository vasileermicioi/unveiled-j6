import type { Story } from "@ladle/react";

import { getProfileCopy } from "../../lib/profile-content";
import { mockUserSession, storyLocale } from "../stories/fixtures";
import { ProfilePage } from "./ProfilePage";

const copy = getProfileCopy(storyLocale);
const { user } = mockUserSession;

export const Default: Story = () => (
  <ProfilePage copy={copy} credits={user.credits} locale={storyLocale} />
);
Default.storyName = "ProfilePage / Default";
