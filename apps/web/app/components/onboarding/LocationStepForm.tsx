"use client";

import { Checkbox, CheckboxGroup, Description, Form, Label, NumberField } from "@heroui/react";
import type { UserProfile } from "@unveiled/db";

import type { Locale } from "../../lib/locale";
import {
  DISTRICTS,
  getDistrictLabel,
  getOnboardingCopy,
  MAX_DISTANCE_MAX,
  MAX_DISTANCE_MIN,
} from "../../lib/onboarding-content";

import { OnboardingFormActions } from "./OnboardingFormActions";

type LocationStepFormProps = {
  locale: Locale;
  profile: UserProfile;
};

export function LocationStepForm({ locale, profile }: LocationStepFormProps) {
  const copy = getOnboardingCopy(locale);
  const defaultDistance = profile.max_distance ?? 10;

  return (
    <Form className="onboarding-form flex flex-col gap-8" method="post">
      <Label className="onboarding-form__section-label">{copy.districtLabel}</Label>
      <CheckboxGroup
        className="onboarding-form__options onboarding-form__options--grid"
        defaultValue={profile.districts ?? []}
        name="districts"
      >
        {DISTRICTS.map((value) => (
          <Checkbox key={value} value={value}>
            <Checkbox.Content>
              <Checkbox.Control>
                <Checkbox.Indicator />
              </Checkbox.Control>
              <Label>{getDistrictLabel(locale, value)}</Label>
            </Checkbox.Content>
          </Checkbox>
        ))}
      </CheckboxGroup>

      <NumberField
        className="onboarding-form__number-field"
        defaultValue={defaultDistance}
        fullWidth
        maxValue={MAX_DISTANCE_MAX}
        minValue={MAX_DISTANCE_MIN}
        name="max_distance"
      >
        <Label className="onboarding-form__section-label">{copy.radiusLabel}</Label>
        <NumberField.Group>
          <NumberField.DecrementButton>-</NumberField.DecrementButton>
          <NumberField.Input />
          <NumberField.IncrementButton>+</NumberField.IncrementButton>
        </NumberField.Group>
        <Description>{copy.km}</Description>
      </NumberField>

      <OnboardingFormActions primaryLabel={copy.next} />
    </Form>
  );
}
