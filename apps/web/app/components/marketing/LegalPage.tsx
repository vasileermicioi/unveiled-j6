import { Paragraph, Surface } from "@heroui/react";

import type { LegalContent } from "../../lib/content/types";
import { PageHero } from "./PageHero";
import { SectionCard } from "./SectionCard";

type LegalPageProps = {
  content: LegalContent;
};

export function LegalPage({ content }: LegalPageProps) {
  return (
    <Surface
      className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:gap-12 lg:px-8"
      variant="transparent"
    >
      <PageHero description={content.intro} headline={content.pageTitle} />

      <Surface className="flex flex-col gap-6" variant="transparent">
        {content.sections.map((section) => (
          <SectionCard key={section.id} title={section.title}>
            <Paragraph color="muted" size="sm">
              {section.placeholder}
            </Paragraph>
          </SectionCard>
        ))}
      </Surface>
    </Surface>
  );
}
