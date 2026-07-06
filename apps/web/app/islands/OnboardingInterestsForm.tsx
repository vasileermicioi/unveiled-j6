import type { UserProfile } from "@unveiled/db";
import { InterestsStepForm } from "../components/onboarding/InterestsStepForm";

import type { Locale } from "../lib/locale";

type OnboardingInterestsFormProps = {
  locale: Locale;
  profile: UserProfile;
};

export default function OnboardingInterestsForm(props: OnboardingInterestsFormProps) {
  return <InterestsStepForm {...props} />;
}
