import type { Story } from "@ladle/react";
import { mockEvent, storyLocale } from "../stories/fixtures";
import { EventDetailPage } from "./EventDetailPage";

export const Guest: Story = () => <EventDetailPage event={mockEvent} locale={storyLocale} />;
Guest.storyName = "EventDetailPage / Guest";
