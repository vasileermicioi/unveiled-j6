import type { UserProfile } from "@unveiled/db";
import { TimingStepForm } from "../components/onboarding/TimingStepForm";

import type { Locale } from "../lib/locale";

type OnboardingTimingFormProps = {
  locale: Locale;
  profile: UserProfile;
};

export default function OnboardingTimingForm(props: OnboardingTimingFormProps) {
  return <TimingStepForm {...props} />;
}
