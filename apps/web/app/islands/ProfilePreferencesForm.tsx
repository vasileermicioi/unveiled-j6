import type { UserProfile } from "@unveiled/db";

import { PreferencesForm } from "../components/profile/PreferencesForm";
import type { Locale } from "../lib/locale";
import type { ProfileCopy } from "../lib/profile-content";

type ProfilePreferencesFormProps = {
  locale: Locale;
  profile: UserProfile;
  copy: ProfileCopy;
  action: string;
};

export default function ProfilePreferencesForm(props: ProfilePreferencesFormProps) {
  return <PreferencesForm {...props} />;
}
