import type { UserProfile } from "@unveiled/db";
import OnboardingAgeForm from "../../islands/OnboardingAgeForm";
import OnboardingInterestsForm from "../../islands/OnboardingInterestsForm";
import OnboardingLocationForm from "../../islands/OnboardingLocationForm";
import OnboardingTimingForm from "../../islands/OnboardingTimingForm";
import type { Locale } from "../../lib/locale";
import type { OnboardingStepKey } from "../../lib/onboarding-content";

import { OnboardingLayout } from "./OnboardingLayout";

type OnboardingStepPageProps = {
  locale: Locale;
  step: OnboardingStepKey;
  profile: UserProfile;
  error?: string | null;
};

export function OnboardingStepPage({
  locale,
  step,
  profile,
  error = null,
}: OnboardingStepPageProps) {
  return (
    <OnboardingLayout error={error} locale={locale} step={step}>
      {step === "age" ? <OnboardingAgeForm locale={locale} profile={profile} /> : null}
      {step === "interests" ? <OnboardingInterestsForm locale={locale} profile={profile} /> : null}
      {step === "location" ? <OnboardingLocationForm locale={locale} profile={profile} /> : null}
      {step === "timing" ? <OnboardingTimingForm locale={locale} profile={profile} /> : null}
    </OnboardingLayout>
  );
}
