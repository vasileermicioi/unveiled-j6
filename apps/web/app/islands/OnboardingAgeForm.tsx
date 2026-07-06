import type { UserProfile } from "@unveiled/db";
import { AgeStepForm } from "../components/onboarding/AgeStepForm";

import type { Locale } from "../lib/locale";

type OnboardingAgeFormProps = {
  locale: Locale;
  profile: UserProfile;
};

export default function OnboardingAgeForm(props: OnboardingAgeFormProps) {
  return <AgeStepForm {...props} />;
}
