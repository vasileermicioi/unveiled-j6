import { Card, Link, Paragraph } from "@heroui/react";

import FaqAccordion from "../../islands/FaqAccordion";
import type { FaqContent } from "../../lib/content/types";

type HelpSectionProps = {
  section: FaqContent["section"];
  compact?: boolean;
};

export function HelpSection({ section, compact = false }: HelpSectionProps) {
  const className = compact ? "help-section help-section--compact" : "help-section";

  return (
    <Card className={className}>
      <Card.Header>
        <Paragraph className="mb-3 uppercase tracking-wide" color="muted" size="sm">
          {section.eyebrow}
        </Paragraph>
        <Card.Title>{section.headline}</Card.Title>
        <Card.Description>
          <Link className="help-section__email" href={`mailto:${section.supportEmail}`}>
            {section.supportEmail}
          </Link>
        </Card.Description>
      </Card.Header>
      <Card.Content className="help-section__content">
        <FaqAccordion items={section.items} />
      </Card.Content>
    </Card>
  );
}
