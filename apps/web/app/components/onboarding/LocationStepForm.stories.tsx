import type { Story } from "@ladle/react";
import { mockProfile, storyLocale } from "../stories/fixtures";
import { LocationStepForm } from "./LocationStepForm";

export const Default: Story = () => <LocationStepForm locale={storyLocale} profile={mockProfile} />;
Default.storyName = "LocationStepForm / Default";
