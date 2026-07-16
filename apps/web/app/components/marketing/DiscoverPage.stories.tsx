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
  />
);
Default.storyName = "DiscoverPage / Default";
