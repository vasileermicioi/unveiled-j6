import type { Story } from "@ladle/react";
import { mockPartnerListItem, mockPartnerLogoUrls, storyLocale } from "../stories/fixtures";
import { AdminPartnersTable } from "./AdminPartnersTable";

export const WithRows: Story = () => (
  <AdminPartnersTable
    listPath="/de/admin/partners"
    locale={storyLocale}
    logoUrls={mockPartnerLogoUrls}
    partners={[mockPartnerListItem]}
    query={{ q: "" }}
  />
);
WithRows.storyName = "AdminPartnersTable / With rows";

export const Empty: Story = () => (
  <AdminPartnersTable
    listPath="/de/admin/partners"
    locale={storyLocale}
    logoUrls={{}}
    partners={[]}
    query={{ q: "" }}
  />
);
Empty.storyName = "AdminPartnersTable / Empty";
