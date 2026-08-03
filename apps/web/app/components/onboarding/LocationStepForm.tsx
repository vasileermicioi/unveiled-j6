"use client";

import { Description, Form, Label, Surface } from "@heroui/react";
import type { UserProfile } from "@unveiled/db";

import type { Locale } from "../../lib/locale";
import { getOnboardingCopy } from "../../lib/onboarding-content";

import { OnboardingFormActions } from "./OnboardingFormActions";

type LocationStepFormProps = {
  locale: Locale;
  profile: UserProfile;
};

export function LocationStepForm({ locale, profile }: LocationStepFormProps) {
  const copy = getOnboardingCopy(locale);

  return (
    <Form className="onboarding-form flex flex-col gap-8" method="post">
      <Surface className="grid gap-4 sm:grid-cols-2" variant="transparent">
        <Surface className="flex flex-col gap-2" variant="transparent">
          <Label className="onboarding-form__section-label" htmlFor="onboarding-country-display">
            {copy.countryLabel}
          </Label>
          <input
            className="onboarding-form__language-filter"
            defaultValue={copy.countryDisplay}
            id="onboarding-country-display"
            readOnly
            tabIndex={-1}
            type="text"
          />
        </Surface>
        <Surface className="flex flex-col gap-2" variant="transparent">
          <Label className="onboarding-form__section-label" htmlFor="onboarding-city-display">
            {copy.cityLabel}
          </Label>
          <input
            className="onboarding-form__language-filter"
            defaultValue={copy.cityDisplay}
            id="onboarding-city-display"
            readOnly
            tabIndex={-1}
            type="text"
          />
        </Surface>
      </Surface>

      <Surface className="flex flex-col gap-2" variant="transparent">
        <Label className="onboarding-form__section-label" htmlFor="zip_code">
          {copy.zipCodeLabel}
        </Label>
        <input
          className="onboarding-form__language-filter"
          defaultValue={profile.zip_code ?? ""}
          id="zip_code"
          inputMode="numeric"
          maxLength={5}
          name="zip_code"
          placeholder="10115"
          type="text"
        />
        <Description>{copy.zipCodeHint}</Description>
      </Surface>

      <input name="country" type="hidden" value="DE" />
      <input name="city" type="hidden" value="berlin" />

      <OnboardingFormActions primaryLabel={copy.next} />
    </Form>
  );
}
