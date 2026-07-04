export type LogoTone = "black" | "white" | "yellow";

export const LOGO_PATHS: Record<LogoTone, string> = {
  black: "/logos/unveiled-logo-black.svg",
  white: "/logos/unveiled-logo-white.svg",
  yellow: "/logos/unveiled-logo-yellow.svg",
};

type LogoProps = {
  tone?: LogoTone;
  className?: string;
  alt?: string;
};

export function Logo({ tone = "black", className = "", alt = "Unveiled Berlin" }: LogoProps) {
  return (
    <img alt={alt} className={`h-[1.1em] w-auto ${className}`.trim()} src={LOGO_PATHS[tone]} />
  );
}
