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
      className={`page-section-header flex flex-col gap-1.5 ${className ?? ""}`.trim()}
      variant="transparent"
    >
      <Paragraph className="page-section-header__eyebrow uppercase">{eyebrow}</Paragraph>
      <Heading id={id} level={level}>
        {headline}
      </Heading>
    </Surface>
  );
}
