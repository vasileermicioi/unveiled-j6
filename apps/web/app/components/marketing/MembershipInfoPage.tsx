import { Button, Card, Heading, Paragraph, Surface } from "@heroui/react";

import type { MembershipCheckoutContent } from "../../lib/content/types";

type MembershipInfoPageProps = {
  content: MembershipCheckoutContent;
};

export function MembershipInfoPage({ content }: MembershipInfoPageProps) {
  return (
    <Surface
      className="mx-auto flex max-w-7xl flex-col items-center px-4 py-12 sm:px-6 lg:px-8"
      variant="transparent"
    >
      <Card className="membership-info w-full max-w-lg text-center">
        <Card.Header className="flex flex-col items-center gap-3">
          <Card.Title>
            <Heading level={1}>{content.title}</Heading>
          </Card.Title>
          <Card.Description>{content.subtitle}</Card.Description>
        </Card.Header>

        <Card.Content className="flex flex-col gap-4">
          <Surface className="flex flex-col gap-2 text-left" variant="transparent">
            {content.perks.map((perk) => (
              <Paragraph key={perk} size="sm">
                {perk}
              </Paragraph>
            ))}
          </Surface>

          <Paragraph color="muted" size="sm">
            {content.guarantee}
          </Paragraph>

          <Button
            className="button button--primary button--md button--full-width"
            isDisabled
            type="button"
          >
            {content.button}
          </Button>

          <Paragraph className="uppercase tracking-wide" color="muted" size="xs">
            {content.secure}
          </Paragraph>
        </Card.Content>
      </Card>
    </Surface>
  );
}
