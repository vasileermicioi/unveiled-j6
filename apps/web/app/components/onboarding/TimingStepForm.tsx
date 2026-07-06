"use client";

import { Checkbox, CheckboxGroup, Form, Label, Surface, Switch } from "@heroui/react";
import type { UserProfile } from "@unveiled/db";

import type { Locale } from "../../lib/locale";
import {
  getOnboardingCopy,
  getPreferredLanguageLabel,
  getTimingLabel,
  getWeekdayLabel,
  PREFERRED_LANGUAGES,
  TIMING_OPTIONS,
  WEEKDAYS,
} from "../../lib/onboarding-content";

import { OnboardingFormActions } from "./OnboardingFormActions";

type TimingStepFormProps = {
  locale: Locale;
  profile: UserProfile;
};

export function TimingStepForm({ locale, profile }: TimingStepFormProps) {
  const copy = getOnboardingCopy(locale);

  return (
    <Form className="onboarding-form flex flex-col gap-8" method="post">
      <Surface className="flex flex-col gap-4" variant="transparent">
        <Label className="onboarding-form__section-label">{copy.timingLabel}</Label>
        <CheckboxGroup
          className="onboarding-form__options onboarding-form__options--grid-three"
          defaultValue={profile.timing ?? []}
          name="timing"
        >
          {TIMING_OPTIONS.map((value) => (
            <Checkbox key={value} value={value}>
              <Checkbox.Content>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Label>{getTimingLabel(locale, value)}</Label>
              </Checkbox.Content>
            </Checkbox>
          ))}
        </CheckboxGroup>
      </Surface>

      <Surface className="flex flex-col gap-4" variant="transparent">
        <Label className="onboarding-form__section-label">{copy.daysLabel}</Label>
        <CheckboxGroup
          className="onboarding-form__options onboarding-form__options--grid"
          defaultValue={profile.preferred_days ?? []}
          name="preferred_days"
        >
          {WEEKDAYS.map((value) => (
            <Checkbox key={value} value={value}>
              <Checkbox.Content>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Label>{getWeekdayLabel(locale, value)}</Label>
              </Checkbox.Content>
            </Checkbox>
          ))}
        </CheckboxGroup>
      </Surface>

      <Surface className="flex flex-col gap-4" variant="transparent">
        <Label className="onboarding-form__section-label">{copy.languagePrefLabel}</Label>
        <CheckboxGroup
          className="onboarding-form__options onboarding-form__options--grid-three"
          defaultValue={profile.preferred_languages ?? []}
          name="preferred_languages"
        >
          {PREFERRED_LANGUAGES.map((value) => (
            <Checkbox key={value} value={value}>
              <Checkbox.Content>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Label>{getPreferredLanguageLabel(locale, value)}</Label>
              </Checkbox.Content>
            </Checkbox>
          ))}
        </CheckboxGroup>
      </Surface>

      <Switch
        className="onboarding-form__switch"
        defaultSelected={profile.accessibility ?? false}
        name="accessibility"
        value="true"
      >
        <Switch.Content>
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
          <Label>{copy.accessibilityLabel}</Label>
        </Switch.Content>
      </Switch>

      <OnboardingFormActions primaryLabel={copy.finish} />
    </Form>
  );
}
