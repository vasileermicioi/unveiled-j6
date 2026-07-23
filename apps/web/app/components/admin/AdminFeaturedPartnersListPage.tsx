import { Link, Paragraph, Surface } from "@heroui/react";
import type { FeaturedPartnerRow } from "@unveiled/db";

import AdminFeaturedPartnersManager from "../../islands/AdminFeaturedPartnersManager";
import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

import { AdminFormError } from "./AdminFormError";
import { AdminPageShell } from "./AdminPageShell";
import { adminFeaturedPartnersAddPath, adminFeaturedPartnersPath } from "./admin-tabs";

type AdminFeaturedPartnersListPageProps = {
  locale: Locale;
  partners: FeaturedPartnerRow[];
  logoUrls: Record<string, string | undefined>;
  error?: string | null;
};

function partnerInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

export function AdminFeaturedPartnersListPage({
  locale,
  partners,
  logoUrls,
  error,
}: AdminFeaturedPartnersListPageProps) {
  const copy = getAdminCopy(locale);
  const listHref = adminFeaturedPartnersPath(locale);

  const managerItems = partners.map((partner) => ({
    partnerId: partner.id,
    name: partner.name,
    thumbnailUrl: logoUrls[partner.id] ?? null,
    initial: partnerInitial(partner.name),
    selectLabel: copy.featuredPartnersSelectLabel(partner.name),
  }));

  return (
    <AdminPageShell
      eyebrow={copy.pageEyebrow}
      actions={
        <Surface className="flex flex-wrap gap-3" variant="transparent">
          <Link
            className="button button--primary button--md"
            href={adminFeaturedPartnersAddPath(locale)}
          >
            {copy.featuredPartnersAddAction}
          </Link>
        </Surface>
      }
      subtitle={copy.featuredPartnersSubtitle}
      title={copy.featuredPartnersTitle}
    >
      {error ? <AdminFormError message={error} /> : null}

      {partners.length === 0 ? (
        <Paragraph>{copy.featuredPartnersEmpty}</Paragraph>
      ) : (
        <AdminFeaturedPartnersManager
          copy={{
            removeBulkAction: copy.featuredPartnersRemoveBulkAction,
            saveOrderAction: copy.featuredPartnersSaveOrderAction,
            reorderHint: copy.featuredPartnersReorderHint,
          }}
          items={managerItems}
          locale={locale}
          reorderAction={listHref}
        />
      )}
    </AdminPageShell>
  );
}
