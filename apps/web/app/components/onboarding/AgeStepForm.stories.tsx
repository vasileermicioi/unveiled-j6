import type { Story } from "@ladle/react";
import { mockProfile, storyLocale } from "../stories/fixtures";
import { AgeStepForm } from "./AgeStepForm";

export const Default: Story = () => <AgeStepForm locale={storyLocale} profile={mockProfile} />;
Default.storyName = "AgeStepForm / Default";
