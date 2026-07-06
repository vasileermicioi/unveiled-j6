"use client";

import { Checkbox, CheckboxGroup, Form, Label, Surface } from "@heroui/react";
import type { UserProfile } from "@unveiled/db";

import type { Locale } from "../../lib/locale";
import {
  getInterestLabel,
  getMoodLabel,
  getOnboardingCopy,
  INTERESTS,
  MOODS,
} from "../../lib/onboarding-content";

import { OnboardingFormActions } from "./OnboardingFormActions";

type InterestsStepFormProps = {
  locale: Locale;
  profile: UserProfile;
};

export function InterestsStepForm({ locale, profile }: InterestsStepFormProps) {
  const copy = getOnboardingCopy(locale);

  return (
    <Form className="onboarding-form flex flex-col gap-8" method="post">
      <Surface className="flex flex-col gap-4" variant="transparent">
        <Label className="onboarding-form__section-label">{copy.interestLabel}</Label>
        <CheckboxGroup
          className="onboarding-form__options onboarding-form__options--grid"
          defaultValue={profile.interests ?? []}
          name="interests"
        >
          {INTERESTS.map((value) => (
            <Checkbox key={value} value={value}>
              <Checkbox.Content>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Label>{getInterestLabel(locale, value)}</Label>
              </Checkbox.Content>
            </Checkbox>
          ))}
        </CheckboxGroup>
      </Surface>

      <Surface className="flex flex-col gap-4" variant="transparent">
        <Label className="onboarding-form__section-label">{copy.moodLabel}</Label>
        <CheckboxGroup
          className="onboarding-form__options onboarding-form__options--grid"
          defaultValue={profile.moods ?? []}
          name="moods"
        >
          {MOODS.map((value) => (
            <Checkbox key={value} value={value}>
              <Checkbox.Content>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Label>{getMoodLabel(locale, value)}</Label>
              </Checkbox.Content>
            </Checkbox>
          ))}
        </CheckboxGroup>
      </Surface>

      <OnboardingFormActions primaryLabel={copy.next} />
    </Form>
  );
}
