import { Paragraph, Surface } from "@heroui/react";
import { Check } from "lucide-react";

import type { LandingPerk } from "../../../lib/content/types";

type LandingPerkRowProps = {
  perk: LandingPerk;
};

export function LandingPerkRow({ perk }: LandingPerkRowProps) {
  const highlight = <Paragraph className="landing-offer__highlight">{perk.highlight}</Paragraph>;
  const title = <Paragraph className="landing-offer__perk-title">{perk.title}</Paragraph>;

  return (
    <Surface className="landing-offer__perk" variant="transparent">
      <Surface className="landing-offer__perk-icon" variant="transparent">
        <Check aria-hidden size={16} strokeWidth={3} />
      </Surface>
      <Surface className="landing-offer__perk-copy" variant="transparent">
        <Surface className="landing-offer__perk-heading" variant="transparent">
          {perk.highlightPlacement === "start" ? (
            <>
              {highlight}
              {title}
            </>
          ) : (
            <>
              {title}
              {highlight}
            </>
          )}
        </Surface>
        <Paragraph className="landing-offer__perk-body">{perk.body}</Paragraph>
      </Surface>
    </Surface>
  );
}
