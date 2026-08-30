import { Card, Heading, Paragraph, Surface } from "@heroui/react";
import { ArrowDown, Clapperboard, Landmark, Users } from "lucide-react";

import type { LandingContent, LandingCreditExample } from "../../../lib/content/types";
import { LandingSectionHeader } from "./LandingSectionHeader";

type LandingCreditsProps = {
  content: LandingContent["credits"];
};

const EXAMPLE_ICONS = {
  community: Users,
  theater: Landmark,
  exhibition: Clapperboard,
} as const;

export function LandingCredits({ content }: LandingCreditsProps) {
  return (
    <Surface
      className="landing-credits mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
      id="credits"
      variant="transparent"
    >
      <LandingSectionHeader eyebrow={content.eyebrow} headline={content.headline} />

      <Surface className="landing-credits__panel" variant="transparent">
        <Surface className="landing-credits__stat" variant="transparent">
          <Heading className="landing-credits__amount" level={2}>
            {content.amount}
          </Heading>
          <Paragraph className="landing-credits__period">{content.period}</Paragraph>
          <Paragraph className="landing-credits__body">{content.body}</Paragraph>
        </Surface>

        <Surface className="landing-credits__example-label" variant="transparent">
          <Paragraph className="landing-credits__example-text">{content.exampleLabel}</Paragraph>
          <ArrowDown aria-hidden size={16} strokeWidth={2.5} />
        </Surface>

        <Surface className="landing-credits__examples" variant="transparent">
          {content.examples.map((example) => (
            <CreditExampleCard example={example} key={example.name} />
          ))}
        </Surface>

        <Paragraph className="landing-credits__note">{content.exampleNote}</Paragraph>

        <Surface className="landing-tally" variant="transparent">
          <Surface className="landing-tally__bar" variant="transparent">
            <Surface className="landing-tally__fill" variant="transparent">
              {" "}
            </Surface>
          </Surface>
          <Paragraph className="landing-tally__txt">
            {content.used} {content.left}
          </Paragraph>
        </Surface>

        <Heading className="landing-credits__mix" level={3}>
          {content.mix}
        </Heading>
      </Surface>
    </Surface>
  );
}

function CreditExampleCard({ example }: { example: LandingCreditExample }) {
  const Icon = EXAMPLE_ICONS[example.icon];
  return (
    <Card className="landing-credits__ex">
      <Card.Content className="landing-credits__ex-body">
        <Surface className="landing-credits__ex-icon" variant="transparent">
          <Icon aria-hidden size={26} strokeWidth={2} />
        </Surface>
        <Paragraph className="landing-credits__ex-name">{example.name}</Paragraph>
        <Paragraph className="landing-credits__ex-credits">{example.credits}</Paragraph>
      </Card.Content>
    </Card>
  );
}
