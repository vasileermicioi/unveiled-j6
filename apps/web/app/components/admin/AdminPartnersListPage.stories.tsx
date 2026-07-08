import type { Story } from "@ladle/react";
import {
  mockAdminListQuery,
  mockPartner,
  mockPartnerLogoUrls,
  storyLocale,
} from "../stories/fixtures";
import { AdminPartnersListPage } from "./AdminPartnersListPage";

export const Default: Story = () => (
  <AdminPartnersListPage
    locale={storyLocale}
    logoUrls={mockPartnerLogoUrls}
    partners={[mockPartner]}
    query={mockAdminListQuery}
    total={1}
  />
);
Default.storyName = "AdminPartnersListPage / Default";
