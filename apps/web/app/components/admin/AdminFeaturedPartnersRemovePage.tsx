import { Button, Form, Link, Paragraph, Surface } from "@heroui/react";
import type { FeaturedPartnerRow } from "@unveiled/db";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

import { AdminFormError } from "./AdminFormError";
import {
  AdminPageShell,
  adminFeaturedPartnersPath,
  adminFeaturedPartnersRemovePath,
} from "./AdminPageShell";

type AdminFeaturedPartnersRemovePageProps = {
  locale: Locale;
  partners: FeaturedPartnerRow[];
  logoUrls: Record<string, string | undefined>;
  selectedPartnerIds: string[];
  error?: string | null;
};

function partnerInitial(name: string): string {
  const trimmed = name.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() : "?";
}

export function AdminFeaturedPartnersRemovePage({
  locale,
  partners,
  logoUrls,
  selectedPartnerIds,
  error,
}: AdminFeaturedPartnersRemovePageProps) {
  const copy = getAdminCopy(locale);
  const listHref = adminFeaturedPartnersPath(locale);
  const selectedSet = new Set(selectedPartnerIds);
  const selectedPartners = partners.filter((partner) => selectedSet.has(partner.id));

  return (
    <AdminPageShell
      eyebrow={copy.pageEyebrow}
      breadcrumbs={[
        { label: copy.featuredPartnersTitle, href: listHref },
        { label: copy.featuredPartnersRemoveTitle },
      ]}
      title={copy.featuredPartnersRemoveTitle}
    >
      {error ? <AdminFormError message={error} /> : null}
      <Paragraph>{copy.featuredPartnersRemoveBody}</Paragraph>

      {selectedPartners.length > 0 ? (
        <Surface className="admin-featured-partners__confirm-grid" variant="transparent">
          {selectedPartners.map((partner) => {
            const thumb = logoUrls[partner.id];
            return (
              <Surface
                className="admin-featured-partners__confirm-tile"
                key={partner.id}
                variant="transparent"
              >
                {thumb ? (
                  <img alt="" className="admin-featured-partners__thumb" src={thumb} />
                ) : (
                  <Surface
                    className="admin-featured-partners__thumb admin-featured-partners__thumb--empty"
                    variant="transparent"
                  >
                    <Paragraph aria-hidden className="admin-featured-partners__initial">
                      {partnerInitial(partner.name)}
                    </Paragraph>
                  </Surface>
                )}
                <Paragraph className="admin-featured-partners__name">{partner.name}</Paragraph>
              </Surface>
            );
          })}
        </Surface>
      ) : null}

      <Form
        action={adminFeaturedPartnersRemovePath(locale)}
        className="flex flex-col gap-4"
        method="post"
      >
        {selectedPartnerIds.map((partnerId) => (
          <input key={partnerId} name="partnerIds" type="hidden" value={partnerId} />
        ))}
        <Surface className="flex flex-col gap-3 sm:flex-row sm:items-center" variant="transparent">
          <Button className="button button--primary button--md" type="submit">
            {copy.featuredPartnersRemoveConfirm}
          </Button>
          <Link className="button button--secondary button--md" href={listHref}>
            {copy.cancel}
          </Link>
        </Surface>
      </Form>
    </AdminPageShell>
  );
}
