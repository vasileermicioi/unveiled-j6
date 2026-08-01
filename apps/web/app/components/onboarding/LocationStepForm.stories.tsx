import type { Story } from "@ladle/react";
import { mockProfile, storyLocale } from "../stories/fixtures";
import { LocationStepForm } from "./LocationStepForm";

export const Default: Story = () => <LocationStepForm locale={storyLocale} profile={mockProfile} />;
Default.storyName = "LocationStepForm / Default";

export const EmptyDistance: Story = () => (
  <LocationStepForm locale={storyLocale} profile={{ ...mockProfile, max_distance: null }} />
);
EmptyDistance.storyName = "LocationStepForm / EmptyDistance";
