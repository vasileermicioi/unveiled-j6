import { Button, Form, Heading, Link, Paragraph, Surface } from "@heroui/react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

import { AdminPageShell } from "./AdminPageShell";

type AdminDashboardPageProps = {
  locale: Locale;
  showSeedButton: boolean;
  seedMessage?: "seeded" | "skipped" | null;
};

export function AdminDashboardPage({
  locale,
  showSeedButton,
  seedMessage = null,
}: AdminDashboardPageProps) {
  const copy = getAdminCopy(locale);

  return (
    <AdminPageShell locale={locale} subtitle={copy.dashboardSubtitle} title={copy.dashboardTitle}>
      {seedMessage === "seeded" ? <Paragraph>{copy.seedSuccess}</Paragraph> : null}
      {seedMessage === "skipped" ? <Paragraph>{copy.seedSkipped}</Paragraph> : null}

      <Surface className="flex flex-col gap-3" variant="transparent">
        <Heading level={2}>{copy.quickLinksTitle}</Heading>
        <Surface className="flex flex-wrap gap-3" variant="transparent">
          <Link
            className="button button--secondary button--md"
            href={localizedPath(locale, "admin/partners")}
          >
            {copy.partnersLink}
          </Link>
          <Link
            className="button button--secondary button--md"
            href={localizedPath(locale, "admin/events")}
          >
            {copy.eventsLink}
          </Link>
        </Surface>
      </Surface>

      {showSeedButton ? (
        <Form method="post">
          <Button
            className="button button--primary button--md"
            name="action"
            type="submit"
            value="seed-demo"
          >
            {copy.seedDemo}
          </Button>
        </Form>
      ) : null}
    </AdminPageShell>
  );
}
