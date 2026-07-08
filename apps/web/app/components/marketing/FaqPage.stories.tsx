import type { Story } from "@ladle/react";

import { getPageContent } from "../../lib/content";
import { storyLocale } from "../stories/fixtures";
import { FaqPage } from "./FaqPage";

export const Default: Story = () => (
  <FaqPage content={getPageContent(storyLocale, "faq")} locale={storyLocale} />
);
Default.storyName = "FaqPage / Default";
