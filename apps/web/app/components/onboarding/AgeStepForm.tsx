"use client";

import { Form, Label, Paragraph, Radio, RadioGroup } from "@heroui/react";
import type { UserProfile } from "@unveiled/db";

import type { Locale } from "../../lib/locale";
import { AGE_GROUPS, getAgeGroupLabel, getOnboardingCopy } from "../../lib/onboarding-content";

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

      <RadioGroup
        className="onboarding-form__options onboarding-form__options--stack"
        defaultValue={profile.age_group ?? undefined}
        name="age_group"
      >
        {AGE_GROUPS.map((value) => (
          <Radio key={value} value={value}>
            <Radio.Content>
              <Radio.Control>
                <Radio.Indicator />
              </Radio.Control>
              <Label>{getAgeGroupLabel(locale, value)}</Label>
            </Radio.Content>
          </Radio>
        ))}
      </RadioGroup>

      <OnboardingFormActions primaryLabel={copy.next} showSkip skipLabel={copy.skip} />
    </Form>
  );
}
