import { listFeaturedPartners, removeFeaturedPartners } from "@unveiled/db";
import type { Context } from "hono";
import { createRoute } from "honox/factory";

import { AdminFeaturedPartnersRemovePage } from "../../../../components/admin/AdminFeaturedPartnersRemovePage";
import {
  adminFeaturedPartnersPath,
  adminFeaturedPartnersRemovePath,
} from "../../../../components/admin/admin-tabs";
import { getAdminCopy } from "../../../../lib/admin-content";
import { buildPartnerLogoUrls } from "../../../../lib/admin-partner-logos";
import {
  type ParsedBody,
  parseFeaturedPartnerIds,
  parseFeaturedPartnerIdsFromQuery,
} from "../../../../lib/admin-prebuilt-image";
import { renderAdminPage } from "../../../../lib/admin-render";
import { guardAdminRoute, mapCatalogError } from "../../../../lib/admin-route";
import { getAuthOptions } from "../../../../lib/auth";
import type { Locale } from "../../../../lib/locale";

function asString(value: string | File | (string | File)[] | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" ? first : undefined;
  }
  return typeof value === "string" ? value : undefined;
}

async function renderRemovePage(
  c: Context,
  options: {
    locale: Locale;
    selectedPartnerIds: string[];
    error?: string | null;
  },
) {
  const { db } = getAuthOptions();
  const partners = await listFeaturedPartners(db);
  const copy = getAdminCopy(options.locale);

  return renderAdminPage(
    c,
    <AdminFeaturedPartnersRemovePage
      error={options.error}
      locale={options.locale}
      logoUrls={buildPartnerLogoUrls(partners)}
      partners={partners}
      selectedPartnerIds={options.selectedPartnerIds}
    />,
    {
      locale: options.locale,
      title: copy.featuredPartnersRemoveTitle,
      canonicalPath: adminFeaturedPartnersRemovePath(options.locale),
    },
  );
}

export const POST = createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const body = (await c.req.parseBody({ all: true })) as ParsedBody;
  const partnerIds = parseFeaturedPartnerIds(body, asString);

  if (partnerIds.length === 0) {
    return c.redirect(adminFeaturedPartnersPath(guard.locale), 302);
  }

  const { db } = getAuthOptions();
  try {
    await removeFeaturedPartners(db, partnerIds);
    return c.redirect(adminFeaturedPartnersPath(guard.locale), 302);
  } catch (error) {
    return renderRemovePage(c, {
      locale: guard.locale,
      selectedPartnerIds: partnerIds,
      error: mapCatalogError(error, guard.locale),
    });
  }
});

export default createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const { db } = getAuthOptions();
  const partners = await listFeaturedPartners(db);
  const queryIds = c.req.queries("partnerIds") ?? [];
  const selectedPartnerIds = parseFeaturedPartnerIdsFromQuery(
    queryIds.length > 0 ? queryIds : c.req.query("partnerIds"),
  ).filter((partnerId) => partners.some((partner) => partner.id === partnerId));

  if (selectedPartnerIds.length === 0) {
    return c.redirect(adminFeaturedPartnersPath(guard.locale), 302);
  }

  return renderRemovePage(c, {
    locale: guard.locale,
    selectedPartnerIds,
  });
});
