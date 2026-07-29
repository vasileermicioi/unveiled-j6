import type { Story } from "@ladle/react";

import { getBookConfirmCopy } from "../../lib/booking-content";
import { getMyTicketsCopy } from "../../lib/bookings-content";
import {
  mockBooking,
  mockEvent,
  mockPdfBooking,
  mockPdfTickets,
  mockPromoTickets,
  mockSecretTickets,
  mockVoucherBooking,
  storyLocale,
} from "../stories/fixtures";
import { BookingTicketCard } from "./BookingTicketCard";

const eventSummary = {
  id: mockEvent.id,
  title: mockEvent.title,
  partnerName: mockEvent.partnerName,
  dateTime: mockEvent.dateTime,
  address: mockEvent.address,
};

export const SecretCode: Story = () => {
  const confirmCopy = getBookConfirmCopy(storyLocale);
  const listCopy = getMyTicketsCopy(storyLocale);

  return (
    <BookingTicketCard
      booking={mockBooking}
      confirmCopy={confirmCopy}
      event={eventSummary}
      listCopy={listCopy}
      locale={storyLocale}
      tickets={mockSecretTickets}
    />
  );
};
SecretCode.storyName = "BookingTicketCard / Secret code";

export const VoucherPromo: Story = () => {
  const confirmCopy = getBookConfirmCopy(storyLocale);
  const listCopy = getMyTicketsCopy(storyLocale);

  return (
    <BookingTicketCard
      booking={mockVoucherBooking}
      confirmCopy={confirmCopy}
      event={eventSummary}
      listCopy={listCopy}
      locale={storyLocale}
      tickets={mockPromoTickets}
    />
  );
};
VoucherPromo.storyName = "BookingTicketCard / Voucher promo";

export const VoucherPdf: Story = () => {
  const confirmCopy = getBookConfirmCopy(storyLocale);
  const listCopy = getMyTicketsCopy(storyLocale);

  return (
    <BookingTicketCard
      booking={mockPdfBooking}
      confirmCopy={confirmCopy}
      event={eventSummary}
      listCopy={listCopy}
      locale={storyLocale}
      tickets={mockPdfTickets}
    />
  );
};
VoucherPdf.storyName = "BookingTicketCard / Voucher PDF";
