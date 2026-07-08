import type { Story } from "@ladle/react";

import { getPageContent } from "../../lib/content";
import { storyLocale } from "../stories/fixtures";
import { LandingPage } from "./LandingPage";

export const Default: Story = () => (
  <LandingPage landing={getPageContent(storyLocale, "landing")} locale={storyLocale} />
);
Default.storyName = "LandingPage / Default";
