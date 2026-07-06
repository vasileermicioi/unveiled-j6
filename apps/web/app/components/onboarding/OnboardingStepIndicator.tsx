import { Paragraph, Surface } from "@heroui/react";

import type { Locale } from "../../lib/locale";
import { getOnboardingCopy } from "../../lib/onboarding-content";

type OnboardingStepIndicatorProps = {
  locale: Locale;
  step: 1 | 2 | 3 | 4;
};

const TOTAL_STEPS = 4;

export function OnboardingStepIndicator({ locale, step }: OnboardingStepIndicatorProps) {
  const copy = getOnboardingCopy(locale);

  return (
    <Surface className="onboarding-step-indicator flex flex-col gap-3" variant="transparent">
      <Paragraph className="font-semibold uppercase tracking-wide" color="muted" size="sm">
        {copy.stepOf(step, TOTAL_STEPS)}
      </Paragraph>
      <Surface className="grid grid-cols-4 gap-2" variant="transparent">
        {Array.from({ length: TOTAL_STEPS }, (_, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber <= step;

          return (
            <Surface
              className="onboarding-step-indicator__segment"
              data-active={isActive ? "true" : "false"}
              key={stepNumber}
              variant="transparent"
            >
              {null}
            </Surface>
          );
        })}
      </Surface>
    </Surface>
  );
}
