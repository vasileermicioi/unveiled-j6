import { Heading, Link, Paragraph, Surface } from "@heroui/react";

type ForbiddenPageProps = {
  locale: "de" | "en";
};

export function ForbiddenPage({ locale }: ForbiddenPageProps) {
  const copy =
    locale === "de"
      ? {
          title: "Zugriff verweigert",
          body: "Du hast keine Berechtigung, diese Seite zu sehen.",
          cta: "Entdecken",
        }
      : {
          title: "Access denied",
          body: "You do not have permission to view this page.",
          cta: "Discover",
        };

  return (
    <Surface
      className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6 lg:px-8"
      variant="transparent"
    >
      <Heading level={1}>403</Heading>
      <Heading level={2}>{copy.title}</Heading>
      <Paragraph className="max-w-xl" color="muted">
        {copy.body}
      </Paragraph>
      <Link className="button button--secondary button--md" href={`/${locale}`}>
        {copy.cta}
      </Link>
    </Surface>
  );
}
