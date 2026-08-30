import type { Story } from "@ladle/react";

import { legacyLandingContent } from "../../lib/content/landing.legacy";
import { storyLocale } from "../stories/fixtures";
import { LandingPageLegacy } from "./LandingPage.legacy";

export const Legacy: Story = () => (
  <LandingPageLegacy landing={legacyLandingContent[storyLocale]} locale={storyLocale} />
);
Legacy.storyName = "LandingPage / Legacy";
