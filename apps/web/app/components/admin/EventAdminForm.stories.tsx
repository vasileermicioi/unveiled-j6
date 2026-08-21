import type { Story } from "@ladle/react";

import { mockPartner, storyLocale } from "../stories/fixtures";
import { EventAdminForm } from "./EventAdminForm";

const partners = [
  {
    id: mockPartner.id,
    name: mockPartner.name,
    street: mockPartner.street,
    houseNumber: mockPartner.houseNumber,
    addressLine2: mockPartner.addressLine2,
    zipCode: mockPartner.zipCode,
    hasOpeningHours: mockPartner.hasOpeningHours,
    openingHours: mockPartner.openingHours,
  },
];

const createHrefs = {
  1: "/en/admin/events/new",
  2: "/en/admin/events/new/dates",
  3: "/en/admin/events/new/image",
} as const;

const editHrefs = {
  1: "/en/admin/events/event-1/edit",
  2: "/en/admin/events/event-1/edit/dates",
  3: "/en/admin/events/event-1/edit/image",
} as const;

export const CreateStepper: Story = () => (
  <EventAdminForm
    action={createHrefs[1]}
    cancelHref="#"
    locale={storyLocale}
    partners={partners}
    step={1}
    stepHrefs={createHrefs}
    submitLabel="Anlegen"
  />
);
CreateStepper.storyName = "EventAdminForm / Create stepper";

export const EditStepper: Story = () => (
  <EventAdminForm
    action={editHrefs[1]}
    cancelHref="#"
    defaults={{
      partnerId: mockPartner.id,
      titleDe: "Poetry & Jazz Night",
      titleEn: "Poetry and Jazz Evening",
      descriptionDe: "Ein Abend mit Spoken Word und Live-Jazz.",
      descriptionEn: "An evening of spoken word and live jazz.",
      street: mockPartner.street,
      houseNumber: mockPartner.houseNumber,
      zipCode: mockPartner.zipCode,
      category: "music",
      currentImageId: "00000000-0000-4000-8000-000000000001",
    }}
    isEdit
    locale={storyLocale}
    partners={partners}
    step={1}
    stepHrefs={editHrefs}
    submitLabel="Speichern"
  />
);
EditStepper.storyName = "EventAdminForm / Edit stepper";

export const DateTicketsTimeSlot: Story = () => (
  <EventAdminForm
    action={createHrefs[2]}
    cancelHref="#"
    locale={storyLocale}
    partners={partners}
    step={2}
    stepHrefs={createHrefs}
    submitLabel="Anlegen"
  />
);
DateTicketsTimeSlot.storyName = "EventAdminForm / Date & tickets time slot";

export const DateTicketsAllDay: Story = () => (
  <EventAdminForm
    action={createHrefs[2]}
    cancelHref="#"
    defaults={{ timingMode: "ALL_DAY" }}
    locale={storyLocale}
    partners={partners}
    step={2}
    stepHrefs={createHrefs}
    submitLabel="Anlegen"
  />
);
DateTicketsAllDay.storyName = "EventAdminForm / Date & tickets all day";

export const DateTicketsPerDate: Story = () => (
  <EventAdminForm
    action={createHrefs[2]}
    cancelHref="#"
    defaults={{ capacityMode: "PER_OCCURRENCE", totalCapacity: 8 }}
    locale={storyLocale}
    partners={partners}
    step={2}
    stepHrefs={createHrefs}
    submitLabel="Anlegen"
  />
);
DateTicketsPerDate.storyName = "EventAdminForm / Date & tickets per date";
