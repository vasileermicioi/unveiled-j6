import type { Event } from "@unveiled/db";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

import { AdminFeaturedAddResults } from "./AdminFeaturedAddResults";
import { AdminFormError } from "./AdminFormError";
import { AdminPageShell, adminFeaturedPath } from "./AdminPageShell";
import { AdminSearchForm } from "./AdminSearchForm";
import { adminFeaturedAddPath } from "./admin-tabs";

type AdminFeaturedAddPageProps = {
  locale: Locale;
  events: Event[];
  query: string;
  error?: string | null;
};

export function AdminFeaturedAddPage({ locale, events, query, error }: AdminFeaturedAddPageProps) {
  const copy = getAdminCopy(locale);
  const listHref = adminFeaturedPath(locale);
  const addPath = adminFeaturedAddPath(locale);

  return (
    <AdminPageShell
      breadcrumbs={[
        { label: copy.featuredTitle, href: listHref },
        { label: copy.featuredAddTitle },
      ]}
      subtitle={copy.featuredAddSubtitle}
      title={copy.featuredAddTitle}
    >
      {error ? <AdminFormError message={error} /> : null}
      <AdminSearchForm action={addPath} defaultQuery={query} locale={locale} />
      <AdminFeaturedAddResults events={events} locale={locale} />
    </AdminPageShell>
  );
}
