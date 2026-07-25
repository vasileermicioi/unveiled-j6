"use client";

import { Form, Label, Surface } from "@heroui/react";
import type { UserProfile } from "@unveiled/db";

import type { Locale } from "../../lib/locale";
import { DISTRICTS, getDistrictLabel, getOnboardingCopy } from "../../lib/onboarding-content";

import { NativePreferenceOption } from "./NativePreferenceOption";
import { OnboardingFormActions } from "./OnboardingFormActions";

type LocationStepFormProps = {
  locale: Locale;
  profile: UserProfile;
};

export function LocationStepForm({ locale, profile }: LocationStepFormProps) {
  const copy = getOnboardingCopy(locale);
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

      <OnboardingFormActions primaryLabel={copy.next} />
    </Form>
  );
}
