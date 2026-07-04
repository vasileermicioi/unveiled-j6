type LogoTone = "black" | "white" | "yellow";

type LogoProps = {
  tone?: LogoTone;
  className?: string;
};

export function Logo({ tone = "black", className = "" }: LogoProps) {
  return (
    <img
      alt="Unveiled"
      className={`h-[1.1em] w-auto ${className}`}
      src={`/logos/unveiled-logo-${tone}.svg`}
    />
  );
}
