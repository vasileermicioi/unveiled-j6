import { Button, Card, Heading, Paragraph, Surface } from "@heroui/react";

import type { MembershipCheckoutContent } from "../../lib/content/types";
import { SectionCard } from "./SectionCard";

type MembershipInfoPageProps = {
  content: MembershipCheckoutContent;
};

export function MembershipInfoPage({ content }: MembershipInfoPageProps) {
  return (
    <Surface
      className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-12 sm:px-6 lg:gap-12 lg:px-8"
      variant="transparent"
    >
      <Card className="membership-hero">
        <Card.Content className="grid gap-8 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end">
          <Surface className="flex flex-col gap-4" variant="transparent">
            <Heading level={1}>{content.title}</Heading>
            <Paragraph color="muted">{content.subtitle}</Paragraph>
            <Paragraph color="muted" size="sm">
              {content.guarantee}
            </Paragraph>
          </Surface>

          <Surface className="flex flex-col gap-3" variant="transparent">
            <Button className="button button--primary button--md" isDisabled type="button">
              {content.button}
            </Button>
            <Paragraph className="uppercase tracking-wide" color="muted" size="xs">
              {content.secure}
            </Paragraph>
          </Surface>
        </Card.Content>
      </Card>

      <Surface className="grid gap-6 md:grid-cols-3" variant="transparent">
        {content.perks.map((perk) => (
          <SectionCard key={perk} title={perk} />
        ))}
      </Surface>
    </Surface>
  );
}
