import { Link, Surface } from "@heroui/react";
import type { FeaturedEventRow } from "@unveiled/db";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

import { AdminFeaturedTable } from "./AdminFeaturedTable";
import { AdminPageShell } from "./AdminPageShell";
import { adminFeaturedAddPath } from "./admin-tabs";

type AdminFeaturedListPageProps = {
  locale: Locale;
  events: FeaturedEventRow[];
};

export function AdminFeaturedListPage({ locale, events }: AdminFeaturedListPageProps) {
  const copy = getAdminCopy(locale);

  return (
    <AdminPageShell
      actions={
        <Surface className="flex flex-wrap gap-3" variant="transparent">
          <Link className="button button--primary button--md" href={adminFeaturedAddPath(locale)}>
            {copy.featuredAddAction}
          </Link>
        </Surface>
      }
      subtitle={copy.featuredSubtitle}
      title={copy.featuredTitle}
    >
      <AdminFeaturedTable events={events} locale={locale} />
    </AdminPageShell>
  );
}
