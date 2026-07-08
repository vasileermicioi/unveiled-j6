import type { Story } from "@ladle/react";
import { storyLocale } from "../stories/fixtures";
import { OnboardingStepIndicator } from "./OnboardingStepIndicator";

export const Step1: Story = () => <OnboardingStepIndicator locale={storyLocale} step={1} />;
Step1.storyName = "OnboardingStepIndicator / Step 1";

export const Step2: Story = () => <OnboardingStepIndicator locale={storyLocale} step={2} />;
Step2.storyName = "OnboardingStepIndicator / Step 2";

export const Step3: Story = () => <OnboardingStepIndicator locale={storyLocale} step={3} />;
Step3.storyName = "OnboardingStepIndicator / Step 3";

export const Step4: Story = () => <OnboardingStepIndicator locale={storyLocale} step={4} />;
Step4.storyName = "OnboardingStepIndicator / Step 4";
