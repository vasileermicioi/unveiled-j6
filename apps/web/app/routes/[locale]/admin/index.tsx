import {
  countEvents,
  countPartners,
  countUpcomingEvents,
  sumRemainingCapacity,
} from "@unveiled/db";
import { runDemoSeed, shouldRunDemoSeed } from "@unveiled/db/seed";
import { createRoute } from "honox/factory";

import { AdminDashboardPage } from "../../../components/admin/AdminDashboardPage";
import { getAdminCopy } from "../../../lib/admin-content";
import { renderAdminPage } from "../../../lib/admin-render";
import { guardAdminRoute } from "../../../lib/admin-route";
import { getAuthOptions } from "../../../lib/auth";

function readSeedMessage(url: URL): "seeded" | "skipped" | null {
  const value = url.searchParams.get("seed");
  if (value === "seeded" || value === "skipped") {
    return value;
  }
  return null;
}

export const POST = createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const body = (await c.req.parseBody()) as Record<string, string | File | (string | File)[]>;
  const action = typeof body.action === "string" ? body.action : undefined;
  if (action !== "seed-demo") {
    return c.redirect(`/${guard.locale}/admin`, 302);
  }

  const { db } = getAuthOptions();
  const result = await runDemoSeed(db);

  return c.redirect(`/${guard.locale}/admin?seed=${result}`, 302);
});

export default createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const { db } = getAuthOptions();
  const showSeedButton = await shouldRunDemoSeed(db);
  const [partnerCount, eventCount, upcomingEventCount, remainingCapacity] = await Promise.all([
    countPartners(db),
    countEvents(db),
    countUpcomingEvents(db),
    sumRemainingCapacity(db),
  ]);
  const copy = getAdminCopy(guard.locale);

  return renderAdminPage(
    c,
    <AdminDashboardPage
      locale={guard.locale}
      metrics={{
        partnerCount,
        eventCount,
        upcomingEventCount,
        remainingCapacity,
      }}
      seedMessage={readSeedMessage(new URL(c.req.url))}
      showSeedButton={showSeedButton}
    />,
    {
      locale: guard.locale,
      title: copy.dashboardTitle,
      subtitle: copy.dashboardSubtitle,
    },
  );
});
