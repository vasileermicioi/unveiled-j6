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

export const CreateStepper: Story = () => (
  <EventAdminForm
    action="#"
    cancelHref="#"
    locale={storyLocale}
    partners={partners}
    submitLabel="Anlegen"
  />
);
CreateStepper.storyName = "EventAdminForm / Create stepper";

export const EditStepper: Story = () => (
  <EventAdminForm
    action="#"
    cancelHref="#"
    defaults={{
      partnerId: mockPartner.id,
      title: "Poetry & Jazz Night",
      description: "An evening of spoken word and live jazz.",
      street: mockPartner.street,
      houseNumber: mockPartner.houseNumber,
      zipCode: mockPartner.zipCode,
      category: "music",
      currentImageId: "00000000-0000-4000-8000-000000000001",
    }}
    isEdit
    locale={storyLocale}
    partners={partners}
    submitLabel="Speichern"
  />
);
EditStepper.storyName = "EventAdminForm / Edit stepper";
