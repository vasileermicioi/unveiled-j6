import type { ReactNode } from "react";

type SectionCardProps = {
  title?: string;
  children: ReactNode;
  className?: string;
  inverted?: boolean;
};

export function SectionCard({ title, children, className, inverted = false }: SectionCardProps) {
  return (
    <section
      className={`card--default p-6 shadow-[var(--surface-shadow)] md:p-8 ${
        inverted ? "border-brand-dark bg-brand-dark text-brand-cream" : "bg-surface text-foreground"
      } ${className ?? ""}`}
    >
      {title ? (
        <h2 className="mb-4 font-black text-2xl uppercase tracking-[-0.05em] md:text-3xl">
          {title}
        </h2>
      ) : null}
      {children}
    </section>
  );
}
