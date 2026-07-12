import type { Story } from "@ladle/react";

import { getBookConfirmCopy } from "../../lib/booking-content";
import { mockBooking, mockEvent, mockVoucherBooking, storyLocale } from "../stories/fixtures";
import { BookConfirmPage } from "./BookConfirmPage";

export const SecretCode: Story = () => (
  <BookConfirmPage
    booking={mockBooking}
    copy={getBookConfirmCopy(storyLocale)}
    event={mockEvent}
    icsHref={`/${storyLocale}/events/${mockEvent.id}/book/confirm?booking=${mockBooking.id}&download=ics`}
    locale={storyLocale}
  />
);
SecretCode.storyName = "BookConfirmPage / Secret code";

export const Voucher: Story = () => (
  <BookConfirmPage
    booking={mockVoucherBooking}
    copy={getBookConfirmCopy(storyLocale)}
    event={mockEvent}
    icsHref={`/${storyLocale}/events/${mockEvent.id}/book/confirm?booking=${mockVoucherBooking.id}&download=ics`}
    locale={storyLocale}
  />
);
Voucher.storyName = "BookConfirmPage / Voucher";
