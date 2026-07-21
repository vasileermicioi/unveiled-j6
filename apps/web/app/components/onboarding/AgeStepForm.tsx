"use client";

import { Form, Label, Paragraph, Surface } from "@heroui/react";
import type { UserProfile } from "@unveiled/db";

import type { Locale } from "../../lib/locale";
import { AGE_GROUPS, getAgeGroupLabel, getOnboardingCopy } from "../../lib/onboarding-content";

import { NativePreferenceOption } from "./NativePreferenceOption";
import { OnboardingFormActions } from "./OnboardingFormActions";

type AgeStepFormProps = {
  locale: Locale;
  profile: UserProfile;
};

export function AgeStepForm({ locale, profile }: AgeStepFormProps) {
  const copy = getOnboardingCopy(locale);

  return (
    <Form className="onboarding-form flex flex-col gap-6" method="post">
      <Label className="onboarding-form__section-label">{copy.ageLabel}</Label>
      <Paragraph color="muted" size="sm">
        {copy.ageSubtitle}
      </Paragraph>

      <Surface
        className="onboarding-form__options onboarding-form__options--stack"
        variant="transparent"
      >
        {AGE_GROUPS.map((value) => (
          <NativePreferenceOption
            defaultChecked={profile.age_group === value}
            key={value}
            label={getAgeGroupLabel(locale, value)}
            name="age_group"
            type="radio"
            value={value}
          />
        ))}
      </Surface>

      <OnboardingFormActions primaryLabel={copy.next} showSkip skipLabel={copy.skip} />
    </Form>
  );
}
