"use client";

import { Form, Label, Surface } from "@heroui/react";
import type { UserProfile } from "@unveiled/db";

import LanguageMultiSelect from "../../islands/LanguageMultiSelect";
import type { Locale } from "../../lib/locale";
import {
  getOnboardingCopy,
  getPreferredLanguageOptions,
  getTimingLabel,
  getWeekdayLabel,
  TIMING_OPTIONS,
  WEEKDAYS,
} from "../../lib/onboarding-content";

import { NativePreferenceOption } from "./NativePreferenceOption";
import { OnboardingFormActions } from "./OnboardingFormActions";

type TimingStepFormProps = {
  locale: Locale;
  profile: UserProfile;
};

export function TimingStepForm({ locale, profile }: TimingStepFormProps) {
  const copy = getOnboardingCopy(locale);
  const selectedTiming = profile.timing ?? [];
  const selectedDays = profile.preferred_days ?? [];
  const selectedLanguages = profile.preferred_languages ?? [];

  return (
    <Form className="onboarding-form flex flex-col gap-8" method="post">
      <Surface className="flex flex-col gap-4" variant="transparent">
        <Label className="onboarding-form__section-label">{copy.timingLabel}</Label>
        <Surface
          className="onboarding-form__options onboarding-form__options--grid-three"
          variant="transparent"
        >
          {TIMING_OPTIONS.map((value) => (
            <NativePreferenceOption
              defaultChecked={selectedTiming.includes(value)}
              key={value}
              label={getTimingLabel(locale, value)}
              name="timing"
              type="checkbox"
              value={value}
            />
          ))}
        </Surface>
      </Surface>

      <Surface className="flex flex-col gap-4" variant="transparent">
        <Label className="onboarding-form__section-label">{copy.daysLabel}</Label>
        <Surface
          className="onboarding-form__options onboarding-form__options--grid"
          variant="transparent"
        >
          {WEEKDAYS.map((value) => (
            <NativePreferenceOption
              defaultChecked={selectedDays.includes(value)}
              key={value}
              label={getWeekdayLabel(locale, value)}
              name="preferred_days"
              type="checkbox"
              value={value}
            />
          ))}
        </Surface>
      </Surface>

      <Surface className="flex flex-col gap-4" variant="transparent">
        <Label className="onboarding-form__section-label">{copy.languagePrefLabel}</Label>
        <LanguageMultiSelect
          filterPlaceholder={copy.languageSearchPlaceholder}
          name="preferred_languages"
          options={getPreferredLanguageOptions(locale)}
          selected={selectedLanguages}
        />
      </Surface>

      <Surface className="flex flex-col gap-4" variant="transparent">
        <Label className="onboarding-form__section-label">{copy.accessibilitySectionLabel}</Label>
        <Surface className="onboarding-form__options" variant="transparent">
          <NativePreferenceOption
            defaultChecked={profile.accessibility ?? false}
            label={copy.accessibilityOptionLabel}
            name="accessibility"
            type="checkbox"
            value="true"
          />
        </Surface>
      </Surface>

      <OnboardingFormActions primaryLabel={copy.finish} />
    </Form>
  );
}
