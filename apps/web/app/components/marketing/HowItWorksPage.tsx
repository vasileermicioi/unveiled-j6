import { Paragraph, Surface } from "@heroui/react";

import type { HowItWorksContent } from "../../lib/content/types";
import { PageSectionHeader } from "./PageSectionHeader";
import { SectionCard } from "./SectionCard";

type HowItWorksPageProps = {
  content: HowItWorksContent;
};

export function HowItWorksPage({ content }: HowItWorksPageProps) {
  return (
    <Surface
      className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:gap-12 lg:px-8"
      variant="transparent"
    >
      <Surface className="flex max-w-3xl flex-col gap-4" variant="transparent">
        <PageSectionHeader eyebrow={content.hero.eyebrow} headline={content.hero.headline} />
        <Paragraph color="muted">{content.hero.subheadline}</Paragraph>
      </Surface>

      <Surface className="grid gap-6 md:grid-cols-3" variant="transparent">
        {content.steps.map((step) => (
          <SectionCard description={step.body} key={step.title} title={step.title} />
        ))}
      </Surface>

      <SectionCard inverted title={content.whyItWorks.eyebrow}>
        <Surface className="grid gap-4 md:grid-cols-3" variant="transparent">
          {content.whyItWorks.points.map((point) => (
            <Surface className="value-tile" key={point} variant="transparent">
              <Paragraph className="font-semibold uppercase leading-snug" size="sm">
                {point}
              </Paragraph>
            </Surface>
          ))}
        </Surface>
      </SectionCard>
    </Surface>
  );
}
