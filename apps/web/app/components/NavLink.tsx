import { Link } from "@heroui/react";

type NavLinkProps = {
  href: string;
  label: string;
  isActive: boolean;
  className?: string;
};

export function NavLink({ href, label, isActive, className = "" }: NavLinkProps) {
  return (
    <Link
      aria-current={isActive ? "page" : undefined}
      className={`nav-link ${className}`.trim()}
      href={href}
    >
      {label}
    </Link>
  );
}
