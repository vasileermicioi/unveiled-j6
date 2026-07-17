import type { Story } from "@ladle/react";

import { PageSectionHeader } from "./PageSectionHeader";

export const Default: Story = () => (
  <PageSectionHeader eyebrow="Bookable with your membership" headline="Current events in Berlin." />
);
Default.storyName = "PageSectionHeader / Default";

export const LongHeadline: Story = () => (
  <PageSectionHeader
    eyebrow="Support"
    headline="Everything you need to know about membership, booking, and check-in in Berlin."
  />
);
LongHeadline.storyName = "PageSectionHeader / Long headline";
