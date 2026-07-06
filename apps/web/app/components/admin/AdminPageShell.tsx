import { Card, Heading, Link, Paragraph, Surface } from "@heroui/react";
import type { ReactNode } from "react";

import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

type AdminBreadcrumb = {
  label: string;
  href?: string;
};

type AdminPageShellProps = {
  locale: Locale;
  title: string;
  subtitle?: string;
  breadcrumbs?: AdminBreadcrumb[];
  actions?: ReactNode;
  children: ReactNode;
};

export function AdminPageShell({
  locale: _locale,
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  children,
}: AdminPageShellProps) {
  return (
    <Surface
      className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10 sm:px-6 lg:px-8"
      variant="transparent"
    >
      <Surface
        className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"
        variant="transparent"
      >
        <Surface className="flex flex-col gap-3" variant="transparent">
          {breadcrumbs.length > 0 ? (
            <Surface className="flex flex-wrap items-center gap-2" variant="transparent">
              {breadcrumbs.map((crumb, index) => (
                <Surface
                  className="flex items-center gap-2"
                  key={`${crumb.label}-${index}`}
                  variant="transparent"
                >
                  {crumb.href ? (
                    <Link href={crumb.href}>{crumb.label}</Link>
                  ) : (
                    <Paragraph size="sm">{crumb.label}</Paragraph>
                  )}
                  {index < breadcrumbs.length - 1 ? <Paragraph size="sm">/</Paragraph> : null}
                </Surface>
              ))}
            </Surface>
          ) : null}
          <Heading level={1}>{title}</Heading>
          {subtitle ? <Paragraph color="muted">{subtitle}</Paragraph> : null}
        </Surface>
        {actions ? <Surface variant="transparent">{actions}</Surface> : null}
      </Surface>

      <Card className="w-full">
        <Card.Content className="flex flex-col gap-6">{children}</Card.Content>
      </Card>
    </Surface>
  );
}

export function adminDashboardPath(locale: Locale): string {
  return localizedPath(locale, "admin");
}

export function adminPartnersPath(locale: Locale): string {
  return localizedPath(locale, "admin/partners");
}
