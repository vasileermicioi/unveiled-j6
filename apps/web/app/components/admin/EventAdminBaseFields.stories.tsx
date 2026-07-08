import type { Story } from "@ladle/react";
import { mockPartner, storyLocale } from "../stories/fixtures";
import { EventAdminBaseFields } from "./EventAdminBaseFields";

export const CollapsedPreview: Story = () => (
  <EventAdminBaseFields
    defaults={{
      partnerId: mockPartner.id,
      title: "Poetry & Jazz Night",
      description: "An evening of spoken word and live jazz.",
      neighborhood: "Charlottenburg",
      category: "music",
      creditPrice: 2,
      totalCapacity: 40,
    }}
    includeDateTime={false}
    locale={storyLocale}
    partners={[{ id: mockPartner.id, name: mockPartner.name }]}
  />
);
CollapsedPreview.storyName = "EventAdminBaseFields / Collapsed preview";
