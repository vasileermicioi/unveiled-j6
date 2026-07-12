import type { Story } from "@ladle/react";

import { getBookConfirmCopy } from "../../lib/booking-content";
import { getMyTicketsCopy } from "../../lib/bookings-content";
import { mockBooking, mockEvent, storyLocale } from "../stories/fixtures";
import { BookingTicketCard } from "./BookingTicketCard";

export const Default: Story = () => {
  const confirmCopy = getBookConfirmCopy(storyLocale);
  const listCopy = getMyTicketsCopy(storyLocale);

  return (
    <BookingTicketCard
      booking={mockBooking}
      confirmCopy={confirmCopy}
      event={{
        id: mockEvent.id,
        title: mockEvent.title,
        partnerName: mockEvent.partnerName,
        dateTime: mockEvent.dateTime,
        address: mockEvent.address,
      }}
      listCopy={listCopy}
      locale={storyLocale}
    />
  );
};
Default.storyName = "BookingTicketCard / Default";
