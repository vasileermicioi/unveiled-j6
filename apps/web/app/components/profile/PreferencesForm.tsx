"use client";

import { Button, Form, Label, Surface } from "@heroui/react";
import { INTERESTS_OTHER_MAX_LENGTH } from "@unveiled/auth/constants";
import type { UserProfile } from "@unveiled/db";
import { useState } from "react";

import LanguageMultiSelect from "../../islands/LanguageMultiSelect";
import type { Locale } from "../../lib/locale";
import {
  DISTRICTS,
  getDistrictLabel,
  getInterestLabel,
  getMoodLabel,
  getOnboardingCopy,
  getPreferredLanguageOptions,
  getTimingLabel,
  getWeekdayLabel,
  INTERESTS,
  MOODS,
  TIMING_OPTIONS,
  WEEKDAYS,
} from "../../lib/onboarding-content";
import type { ProfileCopy } from "../../lib/profile-content";
import { NativePreferenceOption } from "../onboarding/NativePreferenceOption";

type PreferencesFormProps = {
  locale: Locale;
  profile: UserProfile;
  copy: ProfileCopy;
  action: string;
};

export function PreferencesForm({ locale, profile, copy, action }: PreferencesFormProps) {
  const onboarding = getOnboardingCopy(locale);
  const selectedInterests = profile.interests ?? [];
  const selectedMoods = profile.moods ?? [];
  const selectedDistricts = profile.districts ?? [];
  const selectedTiming = profile.timing ?? [];
  const selectedDays = profile.preferred_days ?? [];
  const selectedLanguages = profile.preferred_languages ?? [];
  const [otherChecked, setOtherChecked] = useState(selectedInterests.includes("Other"));

  return (
    <Form action={action} className="onboarding-form flex flex-col gap-8" method="post">
      <Surface className="flex flex-col gap-4" variant="transparent">
        <Label className="onboarding-form__section-label">{onboarding.interestLabel}</Label>
        <Surface
          className="onboarding-form__options onboarding-form__options--grid"
          variant="transparent"
        >
          {INTERESTS.map((value) => (
            <NativePreferenceOption
              defaultChecked={selectedInterests.includes(value)}
              key={value}
              label={getInterestLabel(locale, value)}
              name="interests"
              onChange={
                value === "Other" ? (event) => setOtherChecked(event.target.checked) : undefined
              }
              type="checkbox"
              value={value}
            />
          ))}
        </Surface>
        {otherChecked ? (
          <Surface className="flex flex-col gap-2" variant="transparent">
            <Label className="onboarding-form__section-label" htmlFor="interests_other">
              {onboarding.interestsOtherLabel}
            </Label>
            <input
              className="onboarding-form__language-filter"
              defaultValue={profile.interests_other ?? ""}
              id="interests_other"
              maxLength={INTERESTS_OTHER_MAX_LENGTH}
              name="interests_other"
              placeholder={onboarding.interestsOtherPlaceholder}
              required
              type="text"
            />
          </Surface>
        ) : null}
      </Surface>

      <Surface className="flex flex-col gap-4" variant="transparent">
        <Label className="onboarding-form__section-label">{onboarding.moodLabel}</Label>
        <Surface
          className="onboarding-form__options onboarding-form__options--grid"
          variant="transparent"
        >
          {MOODS.map((value) => (
            <NativePreferenceOption
              defaultChecked={selectedMoods.includes(value)}
              key={value}
              label={getMoodLabel(locale, value)}
              name="moods"
              type="checkbox"
              value={value}
            />
          ))}
        </Surface>
      </Surface>

      <Surface className="flex flex-col gap-4" variant="transparent">
        <Label className="onboarding-form__section-label">{onboarding.districtLabel}</Label>
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
      </Surface>

      <Surface className="flex flex-col gap-4" variant="transparent">
        <Label className="onboarding-form__section-label">{onboarding.timingLabel}</Label>
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
        <Label className="onboarding-form__section-label">{onboarding.daysLabel}</Label>
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
        <Label className="onboarding-form__section-label">{onboarding.languagePrefLabel}</Label>
        <LanguageMultiSelect
          filterPlaceholder={onboarding.languageSearchPlaceholder}
          name="preferred_languages"
          options={getPreferredLanguageOptions(locale)}
          selected={selectedLanguages}
        />
      </Surface>

      <Surface className="flex flex-col gap-4" variant="transparent">
        <Label className="onboarding-form__section-label">
          {onboarding.accessibilitySectionLabel}
        </Label>
        <Surface className="onboarding-form__options" variant="transparent">
          <NativePreferenceOption
            defaultChecked={profile.accessibility ?? false}
            label={onboarding.accessibilityOptionLabel}
            name="accessibility"
            type="checkbox"
            value="true"
          />
        </Surface>
      </Surface>

      <Button className="button button--primary button--md sm:max-w-xs" type="submit">
        {copy.savePreferences}
      </Button>
    </Form>
  );
}
