import { Heading, Paragraph, Surface } from "@heroui/react";

type PageSectionHeaderProps = {
  eyebrow: string;
  headline: string;
  id?: string;
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  className?: string;
};

export function PageSectionHeader({
  eyebrow,
  headline,
  id,
  level = 1,
  className,
}: PageSectionHeaderProps) {
  return (
    <Surface
      className={`page-section-header flex flex-col gap-2 ${className ?? ""}`.trim()}
      variant="transparent"
    >
      <Paragraph className="uppercase tracking-wide" color="muted" size="sm">
        {eyebrow}
      </Paragraph>
      <Heading id={id} level={level}>
        {headline}
      </Heading>
    </Surface>
  );
}
