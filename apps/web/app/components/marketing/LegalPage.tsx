import { Card, Link, Paragraph, Surface } from "@heroui/react";

import FaqAccordion from "../../islands/FaqAccordion";
import type { LegalContent } from "../../lib/content/types";
import { PageSectionHeader } from "./PageSectionHeader";

const SUPPORT_EMAIL = "support@unveiled.berlin";

type LegalPageProps = {
  content: LegalContent;
};

export function LegalPage({ content }: LegalPageProps) {
  const accordionItems = content.sections.map((section) => ({
    question: section.title,
    answer: section.body,
  }));

  return (
    <Surface
      className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:gap-12 lg:px-8"
      variant="transparent"
    >
      <Surface className="legal-hero faq-hero flex max-w-3xl flex-col gap-4" variant="transparent">
        <PageSectionHeader eyebrow={content.eyebrow} headline={content.pageTitle} />
        <Paragraph className="legal-hero__subheadline faq-hero__subheadline max-w-2xl">
          {content.intro}
        </Paragraph>
      </Surface>

      <Card className="help-section">
        <Card.Header>
          <Paragraph className="mb-3 uppercase tracking-wide" color="muted" size="sm">
            {content.eyebrow}
          </Paragraph>
          <Card.Title>{content.pageTitle}</Card.Title>
          <Card.Description>
            <Link className="help-section__email" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </Link>
          </Card.Description>
        </Card.Header>
        <Card.Content className="help-section__content">
          <FaqAccordion items={accordionItems} />
        </Card.Content>
      </Card>
    </Surface>
  );
}
