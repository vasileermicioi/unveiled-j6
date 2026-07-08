import type { Story } from "@ladle/react";

import { getPageContent } from "../../lib/content";
import { storyLocale } from "../stories/fixtures";
import { LegalPage } from "./LegalPage";

export const Impressum: Story = () => (
  <LegalPage content={getPageContent(storyLocale, "impressum")} />
);
Impressum.storyName = "LegalPage / Impressum";

export const Privacy: Story = () => <LegalPage content={getPageContent(storyLocale, "privacy")} />;
Privacy.storyName = "LegalPage / Privacy";

export const Terms: Story = () => <LegalPage content={getPageContent(storyLocale, "terms")} />;
Terms.storyName = "LegalPage / Terms";
