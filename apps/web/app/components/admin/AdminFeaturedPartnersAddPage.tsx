import type { Partner } from "@unveiled/db";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

import { AdminFeaturedPartnersAddResults } from "./AdminFeaturedPartnersAddResults";
import { AdminFormError } from "./AdminFormError";
import { AdminPageShell, adminFeaturedPartnersPath } from "./AdminPageShell";
import { AdminSearchForm } from "./AdminSearchForm";
import { adminFeaturedPartnersAddPath } from "./admin-tabs";

type AdminFeaturedPartnersAddPageProps = {
  locale: Locale;
  partners: Partner[];
  logoUrls: Record<string, string | undefined>;
  query: string;
  error?: string | null;
};

export function AdminFeaturedPartnersAddPage({
  locale,
  partners,
  logoUrls,
  query,
  error,
}: AdminFeaturedPartnersAddPageProps) {
  const copy = getAdminCopy(locale);
  const listHref = adminFeaturedPartnersPath(locale);
  const addPath = adminFeaturedPartnersAddPath(locale);

  return (
    <AdminPageShell
      eyebrow={copy.pageEyebrow}
      breadcrumbs={[
        { label: copy.featuredPartnersTitle, href: listHref },
        { label: copy.featuredPartnersAddTitle },
      ]}
      subtitle={copy.featuredPartnersAddSubtitle}
      title={copy.featuredPartnersAddTitle}
    >
      {error ? <AdminFormError message={error} /> : null}
      <AdminSearchForm action={addPath} defaultQuery={query} locale={locale} />
      <AdminFeaturedPartnersAddResults locale={locale} logoUrls={logoUrls} partners={partners} />
    </AdminPageShell>
  );
}
