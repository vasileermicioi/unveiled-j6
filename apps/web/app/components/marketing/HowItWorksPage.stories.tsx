import type { Story } from "@ladle/react";

import { getPageContent } from "../../lib/content";
import { storyLocale } from "../stories/fixtures";
import { HowItWorksPage } from "./HowItWorksPage";

export const Default: Story = () => (
  <HowItWorksPage content={getPageContent(storyLocale, "how-it-works")} />
);
Default.storyName = "HowItWorksPage / Default";
