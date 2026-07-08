import { Paragraph } from "@heroui/react";
import type { Story } from "@ladle/react";
import { storyLocale } from "../stories/fixtures";
import { OnboardingLayout } from "./OnboardingLayout";

export const StepAge: Story = () => (
  <OnboardingLayout locale={storyLocale} step="age">
    <Paragraph color="muted" size="sm">
      Step form renders in OnboardingStepPage stories.
    </Paragraph>
  </OnboardingLayout>
);
StepAge.storyName = "OnboardingLayout / Step 1 — Age";

export const WithError: Story = () => (
  <OnboardingLayout error="Something went wrong. Please try again." locale={storyLocale} step="age">
    <Paragraph color="muted" size="sm">
      Error state preview.
    </Paragraph>
  </OnboardingLayout>
);
WithError.storyName = "OnboardingLayout / With error";
