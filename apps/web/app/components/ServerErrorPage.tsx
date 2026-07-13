import { Heading, Link, Paragraph, Surface } from "@heroui/react";

type ServerErrorPageProps = {
  locale: "de" | "en";
};

export function ServerErrorPage({ locale }: ServerErrorPageProps) {
  const copy =
    locale === "de"
      ? {
          title: "Etwas ist schiefgelaufen",
          body: "Ein unerwarteter Fehler ist aufgetreten. Bitte versuche es später erneut.",
          cta: "Entdecken",
        }
      : {
          title: "Something went wrong",
          body: "An unexpected error occurred. Please try again later.",
          cta: "Discover",
        };

  return (
    <Surface
      className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-16 text-center sm:px-6 lg:px-8"
      variant="transparent"
    >
      <Heading level={1}>500</Heading>
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
