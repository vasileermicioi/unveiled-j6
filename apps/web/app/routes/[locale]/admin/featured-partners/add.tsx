import {
  addFeaturedPartner,
  CatalogValidationError,
  searchPartnersNotFeatured,
} from "@unveiled/db";
import type { Context } from "hono";
import { createRoute } from "honox/factory";

import { AdminFeaturedPartnersAddPage } from "../../../../components/admin/AdminFeaturedPartnersAddPage";
import {
  adminFeaturedPartnersAddPath,
  adminFeaturedPartnersPath,
} from "../../../../components/admin/admin-tabs";
import { getAdminCopy } from "../../../../lib/admin-content";
import { parseAdminPartnersListQuery } from "../../../../lib/admin-list";
import { buildPartnerLogoUrls } from "../../../../lib/admin-partner-logos";
import { renderAdminPage } from "../../../../lib/admin-render";
import { guardAdminRoute, mapCatalogError } from "../../../../lib/admin-route";
import { getAuthOptions } from "../../../../lib/auth";
import type { Locale } from "../../../../lib/locale";

async function renderAddPage(
  c: Context,
  options: {
    locale: Locale;
    query: ReturnType<typeof parseAdminPartnersListQuery>;
    error?: string | null;
  },
) {
  const { db } = getAuthOptions();
  const partners = await searchPartnersNotFeatured(db, {
    q: options.query.q || undefined,
    limit: 25,
    sort: options.query.sort,
    desc: options.query.dir === "desc",
  });
  const copy = getAdminCopy(options.locale);

  return renderAdminPage(
    c,
    <AdminFeaturedPartnersAddPage
      error={options.error}
      locale={options.locale}
      logoUrls={buildPartnerLogoUrls(partners)}
      partners={partners}
      query={{
        q: options.query.q,
        sort: options.query.sort,
        dir: options.query.dir,
      }}
    />,
    {
      locale: options.locale,
      title: copy.featuredPartnersAddTitle,
      subtitle: copy.featuredPartnersAddSubtitle,
      canonicalPath: adminFeaturedPartnersAddPath(options.locale),
    },
  );
}

export const POST = createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const body = (await c.req.parseBody()) as Record<string, string | File | (string | File)[]>;
  const partnerIdValue = body.partnerId;
  const partnerId = typeof partnerIdValue === "string" ? partnerIdValue.trim() : "";

  if (!partnerId) {
    return renderAddPage(c, {
      locale: guard.locale,
      query: { q: "", page: 1, offset: 0, limit: 25 },
      error: mapCatalogError(
        new CatalogValidationError("PARTNER_NOT_FOUND", "Partner id is required"),
        guard.locale,
      ),
    });
  }

  const { db } = getAuthOptions();
  try {
    await addFeaturedPartner(db, partnerId);
    return c.redirect(adminFeaturedPartnersPath(guard.locale), 302);
  } catch (error) {
    return renderAddPage(c, {
      locale: guard.locale,
      query: { q: "", page: 1, offset: 0, limit: 25 },
      error: mapCatalogError(error, guard.locale),
    });
  }
});

export default createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const query = parseAdminPartnersListQuery(new URL(c.req.url));

  return renderAddPage(c, {
    locale: guard.locale,
    query,
  });
});
