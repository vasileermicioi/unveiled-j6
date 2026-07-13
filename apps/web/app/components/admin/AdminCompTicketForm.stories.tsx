import type { Story } from "@ladle/react";

import { mockEventId, mockMemberId, storyLocale } from "../stories/fixtures";
import { AdminCompTicketForm } from "./AdminCompTicketForm";

const events = [
  { id: mockEventId, label: "Tartuffe — Molière" },
  { id: "00000000-0000-4000-8000-000000000099", label: "Demo Night" },
];

const base = {
  locale: storyLocale,
  userId: mockMemberId,
  memberLabel: "Alex Berlin",
  action: "#",
  events,
} as const;

export const Default: Story = () => <AdminCompTicketForm {...base} />;
Default.storyName = "AdminCompTicketForm / Default";

export const WithError: Story = () => (
  <AdminCompTicketForm {...base} error="Event ist ausverkauft." />
);
WithError.storyName = "AdminCompTicketForm / With error";

export const NoEvents: Story = () => <AdminCompTicketForm {...base} events={[]} />;
NoEvents.storyName = "AdminCompTicketForm / No events";
