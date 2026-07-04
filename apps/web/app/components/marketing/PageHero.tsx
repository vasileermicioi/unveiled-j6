type PageHeroProps = {
  eyebrow?: string;
  headline: string;
  description?: string;
  className?: string;
};

export function PageHero({ eyebrow, headline, description, className }: PageHeroProps) {
  return (
    <section
      className={`card--default bg-surface p-6 shadow-[var(--surface-shadow)] md:p-10 ${className ?? ""}`}
    >
      {eyebrow ? (
        <p className="mb-3 font-semibold text-muted text-sm uppercase tracking-wide">{eyebrow}</p>
      ) : null}
      <h1 className="font-black text-4xl text-foreground uppercase tracking-[-0.05em] md:text-5xl lg:text-6xl">
        {headline}
      </h1>
      {description ? (
        <p className="mt-4 max-w-2xl text-base text-muted md:text-lg">{description}</p>
      ) : null}
    </section>
  );
}
