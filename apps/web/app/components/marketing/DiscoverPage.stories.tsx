import type { Story } from "@ladle/react";

import { getPageContent } from "../../lib/content";
import { mockDiscoverPartner, mockEventCardItem, storyLocale } from "../stories/fixtures";
import { DiscoverPage } from "./DiscoverPage";

export const Default: Story = () => (
  <DiscoverPage
    content={getPageContent(storyLocale, "discover")}
    events={[mockEventCardItem]}
    locale={storyLocale}
    partners={[mockDiscoverPartner]}
    stats={{ eventCount: 12, partnerCount: 8 }}
  />
);
Default.storyName = "DiscoverPage / Default";
