import type { Story } from "@ladle/react";

import { getBookConfirmCopy } from "../../lib/booking-content";
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
import { BookConfirmPage } from "./BookConfirmPage";

export const SecretCode: Story = () => (
  <BookConfirmPage
    booking={mockBooking}
    copy={getBookConfirmCopy(storyLocale)}
    event={mockEvent}
    icsHref={`/${storyLocale}/events/${mockEvent.id}/book/confirm?booking=${mockBooking.id}&download=ics`}
    locale={storyLocale}
    tickets={mockSecretTickets}
  />
);
SecretCode.storyName = "BookConfirmPage / Secret code";

export const VoucherPromo: Story = () => (
  <BookConfirmPage
    booking={mockVoucherBooking}
    copy={getBookConfirmCopy(storyLocale)}
    event={mockEvent}
    icsHref={`/${storyLocale}/events/${mockEvent.id}/book/confirm?booking=${mockVoucherBooking.id}&download=ics`}
    locale={storyLocale}
    tickets={mockPromoTickets}
  />
);
VoucherPromo.storyName = "BookConfirmPage / Voucher promo";

export const VoucherPdf: Story = () => (
  <BookConfirmPage
    booking={mockPdfBooking}
    copy={getBookConfirmCopy(storyLocale)}
    event={mockEvent}
    icsHref={`/${storyLocale}/events/${mockEvent.id}/book/confirm?booking=${mockPdfBooking.id}&download=ics`}
    locale={storyLocale}
    tickets={mockPdfTickets}
  />
);
VoucherPdf.storyName = "BookConfirmPage / Voucher PDF";
