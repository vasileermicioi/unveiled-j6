import { Card } from "@heroui/react";
import type { ReactNode } from "react";

type SectionCardProps = {
  title?: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  inverted?: boolean;
};

export function SectionCard({
  title,
  description,
  children,
  className,
  inverted = false,
}: SectionCardProps) {
  return (
    <Card className={className} variant={inverted ? "secondary" : "default"}>
      {title || description ? (
        <Card.Header>
          {title ? <Card.Title>{title}</Card.Title> : null}
          {description ? <Card.Description>{description}</Card.Description> : null}
        </Card.Header>
      ) : null}
      {children ? <Card.Content>{children}</Card.Content> : null}
    </Card>
  );
}
