import type { Story } from "@ladle/react";

import { OnboardingFormActions } from "./OnboardingFormActions";

export const NextOnly: Story = () => <OnboardingFormActions primaryLabel="Weiter" />;
NextOnly.storyName = "OnboardingFormActions / Next only";

export const WithSkip: Story = () => (
  <OnboardingFormActions primaryLabel="Weiter" showSkip skipLabel="Überspringen" />
);
WithSkip.storyName = "OnboardingFormActions / With skip";
