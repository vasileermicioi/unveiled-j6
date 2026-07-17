import { Paragraph, Surface } from "@heroui/react";

import type { FaqContent } from "../../lib/content/types";
import { HelpSection } from "./HelpSection";
import { PageSectionHeader } from "./PageSectionHeader";

type FaqPageProps = {
  content: FaqContent;
};

export function FaqPage({ content }: FaqPageProps) {
  return (
    <Surface
      className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:gap-12 lg:px-8"
      variant="transparent"
    >
      <Surface className="faq-hero flex max-w-3xl flex-col gap-4" variant="transparent">
        <PageSectionHeader eyebrow={content.hero.eyebrow} headline={content.hero.headline} />
        <Paragraph className="faq-hero__subheadline max-w-2xl" color="muted">
          {content.hero.subheadline}
        </Paragraph>
      </Surface>

      <HelpSection section={content.section} />
    </Surface>
  );
}
