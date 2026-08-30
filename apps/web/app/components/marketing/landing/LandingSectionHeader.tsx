import { Paragraph, Surface } from "@heroui/react";

import { PageSectionHeader } from "../PageSectionHeader";

type LandingSectionHeaderProps = {
  eyebrow: string;
  headline: string;
  body?: string;
  inverted?: boolean;
  level?: 2 | 3;
};

export function LandingSectionHeader({
  eyebrow,
  headline,
  body,
  inverted = false,
  level = 2,
}: LandingSectionHeaderProps) {
  return (
    <Surface
      className={`landing-sec-head flex max-w-3xl flex-col gap-4${inverted ? " landing-sec-head--inverted" : ""}`}
      variant="transparent"
    >
      <PageSectionHeader
        className={inverted ? "page-section-header--on-inverted" : undefined}
        eyebrow={eyebrow}
        headline={headline}
        level={level}
      />
      {body ? (
        <Paragraph
          className={inverted ? "landing-sec-head__body" : undefined}
          color={inverted ? undefined : "muted"}
        >
          {body}
        </Paragraph>
      ) : null}
    </Surface>
  );
}
