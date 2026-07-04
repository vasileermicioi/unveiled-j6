import { Card, Heading, Paragraph } from "@heroui/react";

type PageHeroProps = {
  eyebrow?: string;
  headline: string;
  description?: string;
  className?: string;
};

export function PageHero({ eyebrow, headline, description, className }: PageHeroProps) {
  return (
    <Card className={`page-hero ${className ?? ""}`.trim()}>
      <Card.Header>
        {eyebrow ? (
          <Paragraph className="mb-3 uppercase tracking-wide" color="muted" size="sm">
            {eyebrow}
          </Paragraph>
        ) : null}
        <Card.Title>
          <Heading level={1}>{headline}</Heading>
        </Card.Title>
        {description ? <Card.Description>{description}</Card.Description> : null}
      </Card.Header>
    </Card>
  );
}
