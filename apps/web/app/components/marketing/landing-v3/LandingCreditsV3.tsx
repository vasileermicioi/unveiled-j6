import { Card, Heading, Paragraph, Surface } from "@heroui/react";
import { Compass, Users } from "lucide-react";

import type { LandingV3Credits } from "../../../lib/content/types";
import { LandingSectionHeaderV3 } from "./LandingSectionHeaderV3";

type LandingCreditsV3Props = {
  content: LandingV3Credits;
};

export function LandingCreditsV3({ content }: LandingCreditsV3Props) {
  return (
    <Surface className="landing-band landing-band--inverted" variant="transparent">
      <Surface
        className="landing-credits mx-auto flex max-w-7xl flex-col gap-10 px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
        id="credits"
        variant="transparent"
      >
        <Surface
          className="landing-flex__head mx-auto flex w-full max-w-3xl flex-col items-center"
          variant="transparent"
        >
          <LandingSectionHeaderV3
            body={content.body}
            eyebrow={content.eyebrow}
            headline={`${content.headlineA} ${content.headlineB}`}
            inverted
          />
        </Surface>

        <Surface
          className="landing-credits__ways grid items-stretch gap-6 md:grid-cols-2"
          variant="transparent"
        >
          <Card className="landing-credits__way">
            <Card.Content className="landing-credits__way-body">
              <Surface className="landing-credits__way-icon" variant="transparent">
                <Users aria-hidden size={26} strokeWidth={2} />
              </Surface>
              <Heading className="landing-credits__way-title" level={3}>
                {content.goTogetherTitle}
              </Heading>
              <Paragraph className="landing-credits__way-text">{content.goTogetherBody}</Paragraph>
            </Card.Content>
          </Card>
          <Card className="landing-credits__way">
            <Card.Content className="landing-credits__way-body">
              <Surface className="landing-credits__way-icon" variant="transparent">
                <Compass aria-hidden size={26} strokeWidth={2} />
              </Surface>
              <Heading className="landing-credits__way-title" level={3}>
                {content.ownPlansTitle}
              </Heading>
              <Paragraph className="landing-credits__way-text">{content.ownPlansBody}</Paragraph>
            </Card.Content>
          </Card>
        </Surface>
      </Surface>
    </Surface>
  );
}
