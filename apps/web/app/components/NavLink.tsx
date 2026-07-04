type NavLinkProps = {
  href: string;
  label: string;
  isActive: boolean;
  className?: string;
};

export function NavLink({ href, label, isActive, className = "" }: NavLinkProps) {
  return (
    <a
      className={`inline-flex items-center border-2 px-3 py-2 text-sm font-bold uppercase transition-colors ${
        isActive
          ? "border-brand-dark bg-accent text-foreground"
          : "border-transparent bg-white text-foreground hover:border-brand-dark"
      } ${className}`}
      href={href}
    >
      {label}
    </a>
  );
}
