import { countPartners, listPartners } from "@unveiled/db";
import { buildVariantUrl } from "@unveiled/images/urls";
import { createRoute } from "honox/factory";

import { AdminPartnersListPage } from "../../../../components/admin/AdminPartnersListPage";
import { getAdminCopy } from "../../../../lib/admin-content";
import { renderAdminPage } from "../../../../lib/admin-render";
import {
  buildAdminListQueryString,
  guardAdminRoute,
  parseAdminListQuery,
} from "../../../../lib/admin-route";
import { getAuthOptions } from "../../../../lib/auth";

function buildPartnerLogoUrls(
  partners: Awaited<ReturnType<typeof listPartners>>,
): Record<string, string | undefined> {
  const logoUrls: Record<string, string | undefined> = {};

  for (const partner of partners) {
    if (!partner.logoImageId) {
      continue;
    }

    try {
      logoUrls[partner.id] = buildVariantUrl(partner.logoImageId, "small-320.webp");
    } catch {
      logoUrls[partner.id] = undefined;
    }
  }

  return logoUrls;
}

export default createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const listQuery = parseAdminListQuery(new URL(c.req.url));
  const { db } = getAuthOptions();
  const [partners, total] = await Promise.all([
    listPartners(db, {
      q: listQuery.q || undefined,
      limit: listQuery.limit,
      offset: listQuery.offset,
    }),
    countPartners(db, { q: listQuery.q || undefined }),
  ]);

  const copy = getAdminCopy(guard.locale);
  const queryString = buildAdminListQueryString({
    q: listQuery.q || undefined,
    page: listQuery.page,
  });

  return renderAdminPage(
    c,
    <AdminPartnersListPage
      locale={guard.locale}
      logoUrls={buildPartnerLogoUrls(partners)}
      partners={partners}
      query={{
        q: listQuery.q,
        page: listQuery.page,
        limit: listQuery.limit,
      }}
      total={total}
    />,
    {
      locale: guard.locale,
      title: copy.partnersTitle,
      subtitle: copy.partnersSubtitle,
      canonicalPath: `/${guard.locale}/admin/partners${queryString}`,
    },
  );
});
