import type { Story } from "@ladle/react";
import {
  mockAdminListQuery,
  mockPartnerListItem,
  mockPartnerLogoUrls,
  storyLocale,
} from "../stories/fixtures";
import { AdminPartnersListPage } from "./AdminPartnersListPage";

export const Default: Story = () => (
  <AdminPartnersListPage
    locale={storyLocale}
    logoUrls={mockPartnerLogoUrls}
    partners={[mockPartnerListItem]}
    query={mockAdminListQuery}
    total={1}
  />
);
Default.storyName = "AdminPartnersListPage / Default";

export const SortedByName: Story = () => (
  <AdminPartnersListPage
    locale={storyLocale}
    logoUrls={mockPartnerLogoUrls}
    partners={[mockPartnerListItem]}
    query={{ ...mockAdminListQuery, sort: "name", dir: "asc" }}
    total={1}
  />
);
SortedByName.storyName = "AdminPartnersListPage / Sorted by name";
