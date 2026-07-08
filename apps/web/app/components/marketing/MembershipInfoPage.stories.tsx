import type { Story } from "@ladle/react";

import { getPageContent } from "../../lib/content";
import { storyLocale } from "../stories/fixtures";
import { MembershipInfoPage } from "./MembershipInfoPage";

export const Default: Story = () => (
  <MembershipInfoPage content={getPageContent(storyLocale, "membership")} />
);
Default.storyName = "MembershipInfoPage / Default";
