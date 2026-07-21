import type { Story } from "@ladle/react";

import { GuestFooter } from "./GuestFooter";
import { storyLocale } from "./stories/fixtures";

export const Default: Story = () => <GuestFooter locale={storyLocale} />;
Default.storyName = "GuestFooter / Default";

export const AdminNoMarketingNav: Story = () => (
  <GuestFooter locale={storyLocale} showMarketingNav={false} />
);
AdminNoMarketingNav.storyName = "GuestFooter / ADMIN (no Discover/FAQ)";
