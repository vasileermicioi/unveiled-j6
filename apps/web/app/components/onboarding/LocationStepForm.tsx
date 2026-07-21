"use client";

import { Form, Label, Paragraph, Surface } from "@heroui/react";
import type { UserProfile } from "@unveiled/db";

import type { Locale } from "../../lib/locale";
import {
  DISTRICTS,
  getDistrictLabel,
  getOnboardingCopy,
  MAX_DISTANCE_MAX,
  MAX_DISTANCE_MIN,
} from "../../lib/onboarding-content";

import { NativePreferenceOption } from "./NativePreferenceOption";
import { OnboardingFormActions } from "./OnboardingFormActions";

type LocationStepFormProps = {
  locale: Locale;
  profile: UserProfile;
};

export function LocationStepForm({ locale, profile }: LocationStepFormProps) {
  const copy = getOnboardingCopy(locale);
  const defaultDistance = profile.max_distance ?? 10;
  const selectedDistricts = profile.districts ?? [];

  return (
    <Form className="onboarding-form flex flex-col gap-8" method="post">
      <Label className="onboarding-form__section-label">{copy.districtLabel}</Label>
      <Surface
        className="onboarding-form__options onboarding-form__options--grid"
        variant="transparent"
      >
        {DISTRICTS.map((value) => (
          <NativePreferenceOption
            defaultChecked={selectedDistricts.includes(value)}
            key={value}
            label={getDistrictLabel(locale, value)}
            name="districts"
            type="checkbox"
            value={value}
          />
        ))}
      </Surface>

      <Surface className="onboarding-form__number-field flex flex-col gap-2" variant="transparent">
        <Label className="onboarding-form__section-label" htmlFor="max_distance">
          {copy.radiusLabel}
        </Label>
        <input
          className="onboarding-form__native-number"
          defaultValue={defaultDistance}
          id="max_distance"
          max={MAX_DISTANCE_MAX}
          min={MAX_DISTANCE_MIN}
          name="max_distance"
          step={1}
          type="number"
        />
        <Paragraph color="muted" size="sm">
          {copy.km}
        </Paragraph>
      </Surface>

      <OnboardingFormActions primaryLabel={copy.next} />
    </Form>
  );
}
