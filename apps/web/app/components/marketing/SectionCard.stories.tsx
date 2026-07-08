import { Paragraph } from "@heroui/react";
import type { Story } from "@ladle/react";

import { SectionCard } from "./SectionCard";

export const Default: Story = () => (
  <SectionCard description="Browse partner venues and book with credits." title="Discover events">
    <Paragraph color="muted" size="sm">
      Sample section body content for visual review.
    </Paragraph>
  </SectionCard>
);
Default.storyName = "SectionCard / Default";

export const Inverted: Story = () => (
  <SectionCard inverted title="Why it works">
    <Paragraph color="muted" size="sm">
      Inverted variant for contrast sections.
    </Paragraph>
  </SectionCard>
);
Inverted.storyName = "SectionCard / Inverted";
