import { Heading, Link, Paragraph, Surface } from "@heroui/react";

type NotFoundPageProps = {
  locale: "de" | "en";
};

export function NotFoundPage({ locale }: NotFoundPageProps) {
  const copy =
    locale === "de"
      ? {
          title: "Seite nicht gefunden",
          body: "Die angeforderte Seite existiert nicht.",
          cta: "Entdecken",
        }
      : {
          title: "Page not found",
          body: "The page you requested does not exist.",
          cta: "Discover",
        };

  return (
    <Surface
      className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6 lg:px-8"
      variant="transparent"
    >
      <Heading level={1}>404</Heading>
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
