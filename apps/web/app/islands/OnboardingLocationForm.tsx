import type { UserProfile } from "@unveiled/db";
import { LocationStepForm } from "../components/onboarding/LocationStepForm";

import type { Locale } from "../lib/locale";

type OnboardingLocationFormProps = {
  locale: Locale;
  profile: UserProfile;
};

export default function OnboardingLocationForm(props: OnboardingLocationFormProps) {
  return <LocationStepForm {...props} />;
}
