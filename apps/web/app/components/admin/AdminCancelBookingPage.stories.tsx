import type { Story } from "@ladle/react";

import { mockBooking, storyLocale } from "../stories/fixtures";
import { AdminCancelBookingPage } from "./AdminCancelBookingPage";

export const Confirm: Story = () => (
  <AdminCancelBookingPage
    action="#"
    booking={mockBooking}
    eventTitle="Tartuffe — Molière"
    locale={storyLocale}
  />
);
Confirm.storyName = "AdminCancelBookingPage / Confirm";

export const NotConfirmed: Story = () => (
  <AdminCancelBookingPage
    action="#"
    booking={{ ...mockBooking, status: "CANCELLED" }}
    eventTitle="Tartuffe — Molière"
    locale={storyLocale}
  />
);
NotConfirmed.storyName = "AdminCancelBookingPage / Not confirmed";
