"use client";

import {
  Button,
  Checkbox,
  CheckboxGroup,
  Description,
  Form,
  Label,
  NumberField,
  Surface,
  Switch,
} from "@heroui/react";
import type { UserProfile } from "@unveiled/db";

import type { Locale } from "../../lib/locale";
import {
  DISTRICTS,
  getDistrictLabel,
  getInterestLabel,
  getMoodLabel,
  getOnboardingCopy,
  getPreferredLanguageLabel,
  getTimingLabel,
  getWeekdayLabel,
  INTERESTS,
  MAX_DISTANCE_MAX,
  MAX_DISTANCE_MIN,
  MOODS,
  PREFERRED_LANGUAGES,
  TIMING_OPTIONS,
  WEEKDAYS,
} from "../../lib/onboarding-content";
import type { ProfileCopy } from "../../lib/profile-content";

type PreferencesFormProps = {
  locale: Locale;
  profile: UserProfile;
  copy: ProfileCopy;
  action: string;
};

export function PreferencesForm({ locale, profile, copy, action }: PreferencesFormProps) {
  const onboarding = getOnboardingCopy(locale);
  const defaultDistance = profile.max_distance ?? 10;

  return (
    <Form action={action} className="onboarding-form flex flex-col gap-8" method="post">
      <Surface className="flex flex-col gap-4" variant="transparent">
        <Label className="onboarding-form__section-label">{onboarding.interestLabel}</Label>
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
        <Label className="onboarding-form__section-label">{onboarding.moodLabel}</Label>
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

      <Surface className="flex flex-col gap-4" variant="transparent">
        <Label className="onboarding-form__section-label">{onboarding.districtLabel}</Label>
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
      </Surface>

      <NumberField
        className="onboarding-form__number-field"
        defaultValue={defaultDistance}
        fullWidth
        maxValue={MAX_DISTANCE_MAX}
        minValue={MAX_DISTANCE_MIN}
        name="max_distance"
      >
        <Label className="onboarding-form__section-label">{onboarding.radiusLabel}</Label>
        <NumberField.Group>
          <NumberField.DecrementButton>-</NumberField.DecrementButton>
          <NumberField.Input />
          <NumberField.IncrementButton>+</NumberField.IncrementButton>
        </NumberField.Group>
        <Description>{onboarding.km}</Description>
      </NumberField>

      <Surface className="flex flex-col gap-4" variant="transparent">
        <Label className="onboarding-form__section-label">{onboarding.timingLabel}</Label>
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
        <Label className="onboarding-form__section-label">{onboarding.daysLabel}</Label>
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
        <Label className="onboarding-form__section-label">{onboarding.languagePrefLabel}</Label>
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
          <Label>{onboarding.accessibilityLabel}</Label>
        </Switch.Content>
      </Switch>

      <Button className="button button--primary button--md sm:max-w-xs" type="submit">
        {copy.savePreferences}
      </Button>
    </Form>
  );
}
