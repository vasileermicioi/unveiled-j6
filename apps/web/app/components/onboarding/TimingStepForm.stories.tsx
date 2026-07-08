import type { Story } from "@ladle/react";
import { mockProfile, storyLocale } from "../stories/fixtures";
import { TimingStepForm } from "./TimingStepForm";

export const Default: Story = () => <TimingStepForm locale={storyLocale} profile={mockProfile} />;
Default.storyName = "TimingStepForm / Default";
