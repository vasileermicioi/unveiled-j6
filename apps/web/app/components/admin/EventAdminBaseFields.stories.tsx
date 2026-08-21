import type { Story } from "@ladle/react";
import { mockPartner, storyLocale } from "../stories/fixtures";
import { EventAdminBaseFields } from "./EventAdminBaseFields";

export const CollapsedPreview: Story = () => (
  <EventAdminBaseFields
    defaults={{
      partnerId: mockPartner.id,
      titleDe: "Poetry & Jazz Night",
      titleEn: "Poetry and Jazz Evening",
      descriptionDe: "Ein Abend mit Spoken Word und Live-Jazz.",
      descriptionEn: "An evening of spoken word and live jazz.",
      street: mockPartner.street,
      houseNumber: mockPartner.houseNumber,
      addressLine2: mockPartner.addressLine2,
      country: "DE",
      city: "berlin",
      zipCode: mockPartner.zipCode,
      category: "music",
      totalCapacity: 40,
      languages: ["DE", "EN"],
      hasSubtitles: true,
      subtitleLanguages: ["DE", "EN"],
    }}
    includeDateTime={false}
    locale={storyLocale}
    partners={[
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
    ]}
  />
);
CollapsedPreview.storyName = "EventAdminBaseFields / Collapsed preview";
