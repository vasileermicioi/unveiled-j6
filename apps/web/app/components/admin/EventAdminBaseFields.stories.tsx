import type { Story } from "@ladle/react";
import { mockPartner, storyLocale } from "../stories/fixtures";
import { EventAdminBaseFields } from "./EventAdminBaseFields";

export const CollapsedPreview: Story = () => (
  <EventAdminBaseFields
    defaults={{
      partnerId: mockPartner.id,
      title: "Poetry & Jazz Night",
      description: "An evening of spoken word and live jazz.",
      street: mockPartner.street,
      houseNumber: mockPartner.houseNumber,
      addressLine2: mockPartner.addressLine2,
      country: "DE",
      city: "berlin",
      zipCode: mockPartner.zipCode,
      category: "music",
      creditPrice: 2,
      totalCapacity: 40,
      languages: ["DE", "EN"],
      hasSubtitles: true,
      subtitleLanguage: "EN",
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
      },
    ]}
  />
);
CollapsedPreview.storyName = "EventAdminBaseFields / Collapsed preview";
