type LogoTone = "black" | "white" | "yellow";

type LogoProps = {
  tone?: LogoTone;
  className?: string;
};

const toneTextClass: Record<LogoTone, string> = {
  black: "text-brand-dark",
  white: "text-white",
  yellow: "text-brand-yellow",
};

export function Logo({ tone = "black", className = "" }: LogoProps) {
  return (
    <span
      aria-label="Unveiled"
      className={`inline-block font-black uppercase tracking-[-0.05em] leading-none ${toneTextClass[tone]} ${className}`}
      role="img"
    >
      UNVEILED
    </span>
  );
}
