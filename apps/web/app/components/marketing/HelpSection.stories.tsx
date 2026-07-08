import type { Story } from "@ladle/react";

import { getPageContent } from "../../lib/content";
import { storyLocale } from "../stories/fixtures";
import { HelpSection } from "./HelpSection";

const faqSection = getPageContent(storyLocale, "faq").section;

export const Default: Story = () => <HelpSection section={faqSection} />;
Default.storyName = "HelpSection / Default";

export const Compact: Story = () => <HelpSection compact section={faqSection} />;
Compact.storyName = "HelpSection / Compact";
