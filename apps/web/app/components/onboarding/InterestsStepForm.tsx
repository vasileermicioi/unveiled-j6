"use client";

import { Form, Label, Surface } from "@heroui/react";
import type { UserProfile } from "@unveiled/db";

import type { Locale } from "../../lib/locale";
import {
  getInterestLabel,
  getMoodLabel,
  getOnboardingCopy,
  INTERESTS,
  MOODS,
} from "../../lib/onboarding-content";

import { NativePreferenceOption } from "./NativePreferenceOption";
import { OnboardingFormActions } from "./OnboardingFormActions";

type InterestsStepFormProps = {
  locale: Locale;
  profile: UserProfile;
};

export function InterestsStepForm({ locale, profile }: InterestsStepFormProps) {
  const copy = getOnboardingCopy(locale);
  const selectedInterests = profile.interests ?? [];
  const selectedMoods = profile.moods ?? [];

  return (
    <Form className="onboarding-form flex flex-col gap-8" method="post">
      <Surface className="flex flex-col gap-4" variant="transparent">
        <Label className="onboarding-form__section-label">{copy.interestLabel}</Label>
        <Surface
          className="onboarding-form__options onboarding-form__options--grid"
          variant="transparent"
        >
          {INTERESTS.map((value) => (
            <NativePreferenceOption
              defaultChecked={selectedInterests.includes(value)}
              key={value}
              label={getInterestLabel(locale, value)}
              name="interests"
              type="checkbox"
              value={value}
            />
          ))}
        </Surface>
      </Surface>

      <Surface className="flex flex-col gap-4" variant="transparent">
        <Label className="onboarding-form__section-label">{copy.moodLabel}</Label>
        <Surface
          className="onboarding-form__options onboarding-form__options--grid"
          variant="transparent"
        >
          {MOODS.map((value) => (
            <NativePreferenceOption
              defaultChecked={selectedMoods.includes(value)}
              key={value}
              label={getMoodLabel(locale, value)}
              name="moods"
              type="checkbox"
              value={value}
            />
          ))}
        </Surface>
      </Surface>

      <OnboardingFormActions primaryLabel={copy.next} />
    </Form>
  );
}
