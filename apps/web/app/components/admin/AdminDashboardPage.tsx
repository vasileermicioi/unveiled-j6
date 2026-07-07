import { Button, Form, Paragraph } from "@heroui/react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

import { AdminKpiGrid, type AdminMetrics } from "./AdminKpiGrid";
import { AdminPageShell } from "./AdminPageShell";

type AdminDashboardPageProps = {
  locale: Locale;
  metrics: AdminMetrics;
  showSeedButton: boolean;
  seedMessage?: "seeded" | "skipped" | null;
};

export function AdminDashboardPage({
  locale,
  metrics,
  showSeedButton,
  seedMessage = null,
}: AdminDashboardPageProps) {
  const copy = getAdminCopy(locale);

  const actions = showSeedButton ? (
    <Form className="admin-toolbar__form" method="post">
      <Button
        className="button button--secondary button--md"
        name="action"
        type="submit"
        value="seed-demo"
      >
        {copy.seedDemo}
      </Button>
    </Form>
  ) : null;

  return (
    <AdminPageShell
      actions={actions}
      subtitle={copy.dashboardSubtitle}
      title={copy.dashboardTitle}
      wrapInCard={false}
    >
      <AdminKpiGrid locale={locale} metrics={metrics} />

      {seedMessage === "seeded" ? (
        <Paragraph className="admin-flash admin-flash--success">{copy.seedSuccess}</Paragraph>
      ) : null}
      {seedMessage === "skipped" ? (
        <Paragraph className="admin-flash" color="muted">
          {copy.seedSkipped}
        </Paragraph>
      ) : null}
    </AdminPageShell>
  );
}
