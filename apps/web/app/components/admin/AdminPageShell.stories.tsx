import { Link, Paragraph } from "@heroui/react";
import type { Story } from "@ladle/react";

import { getAdminCopy } from "../../lib/admin-content";
import { storyLocale } from "../stories/fixtures";
import { AdminPageShell } from "./AdminPageShell";

const copy = getAdminCopy(storyLocale);

export const WithCard: Story = () => (
  <AdminPageShell
    eyebrow={copy.pageEyebrow}
    subtitle={copy.eventsSubtitle}
    title={copy.eventsTitle}
  >
    <Paragraph color="muted">List content inside card shell.</Paragraph>
  </AdminPageShell>
);
WithCard.storyName = "AdminPageShell / Wrapped in card";

export const Overview: Story = () => (
  <AdminPageShell
    actions={
      <Link className="button button--secondary button--md" href="#">
        {copy.seedDemo}
      </Link>
    }
    eyebrow={copy.pageEyebrow}
    subtitle={copy.dashboardSubtitle}
    title={copy.dashboardTitle}
    wrapInCard={false}
  >
    <Paragraph color="muted">KPI grid renders here on dashboard.</Paragraph>
  </AdminPageShell>
);
Overview.storyName = "AdminPageShell / Overview (no card)";
