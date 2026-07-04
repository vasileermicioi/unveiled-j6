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
    <div className="mx-auto flex max-w-3xl flex-col items-start gap-4 px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="font-black text-4xl text-foreground uppercase tracking-[-0.05em] md:text-5xl">
        404
      </h1>
      <p className="font-black text-2xl text-foreground uppercase tracking-[-0.05em]">
        {copy.title}
      </p>
      <p className="max-w-xl text-base text-muted">{copy.body}</p>
      <a
        className="button--primary inline-flex border-2 border-brand-dark bg-accent px-4 py-2 font-semibold text-foreground uppercase"
        href={`/${locale}`}
      >
        {copy.cta}
      </a>
    </div>
  );
}
