import type { Story } from "@ladle/react";

import { getBookPageCopy } from "../../lib/booking-content";
import { mockEvent, storyLocale } from "../stories/fixtures";
import { BookEventPage } from "./BookEventPage";

export const Form: Story = () => (
  <BookEventPage
    availableCredits={12}
    copy={getBookPageCopy(storyLocale)}
    event={mockEvent}
    idempotencyKey="story-book-key"
    locale={storyLocale}
    maxQty={1}
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

const alreadyBookedMorning = new Date("2030-09-01T08:00:00.000Z");
const alreadyBookedEvening = new Date("2030-09-01T17:00:00.000Z");
const alreadyBookedEvent = {
  ...mockEvent,
  dateTime: alreadyBookedMorning,
  dateTimes: [alreadyBookedMorning, alreadyBookedEvening],
  occurrenceCreditPrices: [1, 4],
};

export const AlreadyBooked: Story = () => (
  <BookEventPage
    copy={getBookPageCopy(storyLocale)}
    event={alreadyBookedEvent}
    idempotencyKey="story-book-key"
    locale={storyLocale}
    occurrences={[
      {
        startsAtIso: alreadyBookedMorning.toISOString(),
        creditPrice: 1,
        maxQty: 1,
      },
      {
        startsAtIso: alreadyBookedEvening.toISOString(),
        creditPrice: 4,
        maxQty: 1,
      },
    ]}
    slotDateTimeIso={alreadyBookedMorning.toISOString()}
    view="already_booked"
  />
);
AlreadyBooked.storyName = "BookEventPage / Already booked";
