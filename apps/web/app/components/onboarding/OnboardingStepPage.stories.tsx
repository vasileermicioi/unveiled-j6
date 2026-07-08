import type { Story } from "@ladle/react";
import { mockProfile, storyLocale } from "../stories/fixtures";
import { OnboardingStepPage } from "./OnboardingStepPage";

export const Age: Story = () => (
  <OnboardingStepPage locale={storyLocale} profile={mockProfile} step="age" />
);
Age.storyName = "OnboardingStepPage / Age";

export const Interests: Story = () => (
  <OnboardingStepPage locale={storyLocale} profile={mockProfile} step="interests" />
);
Interests.storyName = "OnboardingStepPage / Interests";

export const Location: Story = () => (
  <OnboardingStepPage locale={storyLocale} profile={mockProfile} step="location" />
);
Location.storyName = "OnboardingStepPage / Location";

export const Timing: Story = () => (
  <OnboardingStepPage locale={storyLocale} profile={mockProfile} step="timing" />
);
Timing.storyName = "OnboardingStepPage / Timing";
