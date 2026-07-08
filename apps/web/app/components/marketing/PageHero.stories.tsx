import type { Story } from "@ladle/react";

import { PageHero } from "./PageHero";

export const Default: Story = () => (
  <PageHero
    description="Curated cultural access for Berlin locals."
    eyebrow="Unveiled Berlin"
    headline="Discover hidden culture"
  />
);
Default.storyName = "PageHero / Default";
