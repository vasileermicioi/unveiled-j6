import type { Story } from "@ladle/react";
import { mockProfile, storyLocale } from "../stories/fixtures";
import { InterestsStepForm } from "./InterestsStepForm";

export const Default: Story = () => (
  <InterestsStepForm locale={storyLocale} profile={mockProfile} />
);
Default.storyName = "InterestsStepForm / Default";
