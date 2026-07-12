import type { Story } from "@ladle/react";

import { getBookPageCopy } from "../../lib/booking-content";
import { mockEvent, storyLocale } from "../stories/fixtures";
import { BookEventPage } from "./BookEventPage";

export const Form: Story = () => (
  <BookEventPage
    availableCredits={12}
    copy={getBookPageCopy(storyLocale)}
    defaultTickets="1"
    event={mockEvent}
    idempotencyKey="story-book-key"
    locale={storyLocale}
    view="form"
  />
);
Form.storyName = "BookEventPage / Form";

export const PastDue: Story = () => (
  <BookEventPage
    copy={getBookPageCopy(storyLocale)}
    event={mockEvent}
    idempotencyKey="story-book-key"
    locale={storyLocale}
    view="past_due"
  />
);
PastDue.storyName = "BookEventPage / Past due";
