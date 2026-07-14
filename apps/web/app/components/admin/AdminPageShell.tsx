import { Card, Heading, Link, Paragraph, Surface } from "@heroui/react";
import type { ReactNode } from "react";

type AdminBreadcrumb = {
  label: string;
  href?: string;
};

type AdminPageShellProps = {
  title: string;
  subtitle?: string;
  breadcrumbs?: AdminBreadcrumb[];
  actions?: ReactNode;
  /** Overview KPI grid is unwrapped; other admin pages render inside a card. */
  wrapInCard?: boolean;
  children: ReactNode;
};

export function AdminPageShell({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  wrapInCard = true,
  children,
}: AdminPageShellProps) {
  return (
    <>
      <Surface className="admin-shell__intro flex flex-col gap-3" variant="transparent">
        {breadcrumbs.length > 0 ? (
          <Surface className="flex flex-wrap items-center gap-2" variant="transparent">
            {breadcrumbs.map((crumb, index) => (
              <Surface
                className="flex items-center gap-2"
                key={crumb.href ?? `current:${crumb.label}`}
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
        {subtitle ? (
          <Paragraph className="admin-shell__subtitle" color="muted">
            {subtitle}
          </Paragraph>
        ) : null}
      </Surface>

      {actions ? (
        <Surface
          className="admin-toolbar admin-toolbar--standalone flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-end"
          variant="transparent"
        >
          {actions}
        </Surface>
      ) : null}

      {wrapInCard ? (
        <Card className="w-full">
          <Card.Content className="flex flex-col gap-6">{children}</Card.Content>
        </Card>
      ) : (
        <Surface className="admin-overview flex flex-col gap-6" variant="transparent">
          {children}
        </Surface>
      )}
    </>
  );
}

export type { AdminTab } from "./admin-tabs";
export {
  adminBookingCancelPath,
  adminDashboardPath,
  adminEventsPath,
  adminPartnersPath,
  adminUserAdjustCreditsPath,
  adminUserCompTicketPath,
  adminUserDetailPath,
  adminUserFreezePath,
  adminUserRefundPath,
  adminUsersPath,
  adminWaitlistPath,
  adminWaitlistPromotePath,
} from "./admin-tabs";
