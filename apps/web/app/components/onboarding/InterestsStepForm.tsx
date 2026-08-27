import { Form, Label, Surface } from "@heroui/react";
import { INTERESTS_OTHER_MAX_LENGTH } from "@unveiled/auth/constants";
import type { UserProfile } from "@unveiled/db";
import { useState } from "react";

import type { Locale } from "../../lib/locale";
import {
  getInterestLabel,
  getMoodLabel,
  getOnboardingCopy,
  INTERESTS,
  MOODS,
} from "../../lib/onboarding-content";

import { NativePreferenceOption } from "./NativePreferenceOption";
import { OnboardingFormActions } from "./OnboardingFormActions";

type InterestsStepFormProps = {
  locale: Locale;
  profile: UserProfile;
};

export function InterestsStepForm({ locale, profile }: InterestsStepFormProps) {
  const copy = getOnboardingCopy(locale);
  const selectedInterests = profile.interests ?? [];
  const selectedMoods = profile.moods ?? [];
  const [otherChecked, setOtherChecked] = useState(selectedInterests.includes("Other"));

  return (
    <Form className="onboarding-form flex flex-col gap-8" method="post">
      <Surface className="flex flex-col gap-4" variant="transparent">
        <Label className="onboarding-form__section-label">{copy.interestLabel}</Label>
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
              {copy.interestsOtherLabel}
            </Label>
            <input
              className="onboarding-form__language-filter"
              defaultValue={profile.interests_other ?? ""}
              id="interests_other"
              maxLength={INTERESTS_OTHER_MAX_LENGTH}
              name="interests_other"
              placeholder={copy.interestsOtherPlaceholder}
              type="text"
            />
          </Surface>
        ) : null}
      </Surface>

      <Surface className="flex flex-col gap-4" variant="transparent">
        <Label className="onboarding-form__section-label">{copy.moodLabel}</Label>
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

      <OnboardingFormActions primaryLabel={copy.next} />
    </Form>
  );
}
