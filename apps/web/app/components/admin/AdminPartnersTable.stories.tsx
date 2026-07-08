import type { Story } from "@ladle/react";
import { mockPartner, mockPartnerLogoUrls, storyLocale } from "../stories/fixtures";
import { AdminPartnersTable } from "./AdminPartnersTable";

export const WithRows: Story = () => (
  <AdminPartnersTable
    locale={storyLocale}
    logoUrls={mockPartnerLogoUrls}
    partners={[mockPartner]}
  />
);
WithRows.storyName = "AdminPartnersTable / With rows";

export const Empty: Story = () => (
  <AdminPartnersTable locale={storyLocale} logoUrls={{}} partners={[]} />
);
Empty.storyName = "AdminPartnersTable / Empty";
