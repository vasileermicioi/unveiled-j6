import { createPartner } from "@unveiled/db";
import { createRoute } from "honox/factory";

import {
  AdminPageShell,
  adminDashboardPath,
  adminPartnersPath,
} from "../../../../components/admin/AdminPageShell";
import { PartnerForm, partnerListPath } from "../../../../components/admin/PartnerForm";
import { getAdminCopy } from "../../../../lib/admin-content";
import { renderAdminPage } from "../../../../lib/admin-render";
import {
  guardAdminRoute,
  mapCatalogError,
  parsePartnerFormBody,
} from "../../../../lib/admin-route";
import { getAuthOptions } from "../../../../lib/auth";

export const POST = createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const copy = getAdminCopy(guard.locale);

  try {
    const body = (await c.req.parseBody()) as Record<string, string | File | (string | File)[]>;
    const values = await parsePartnerFormBody(body);
    const { db } = getAuthOptions();

    await createPartner(db, {
      name: values.name,
      address: values.address,
      contactEmail: values.contactEmail,
      logoUpload: values.logoUpload,
      logoUrl: values.logoUrl,
      uploadedBy: guard.session.user.id,
    });

    return c.redirect(partnerListPath(guard.locale), 302);
  } catch (error) {
    return renderAdminPage(
      c,
      <AdminPageShell
        breadcrumbs={[
          { label: copy.navDashboard, href: adminDashboardPath(guard.locale) },
          { label: copy.partnersTitle, href: adminPartnersPath(guard.locale) },
          { label: copy.newPartnerTitle },
        ]}
        locale={guard.locale}
        title={copy.newPartnerTitle}
      >
        <PartnerForm
          action={`/${guard.locale}/admin/partners/new`}
          cancelHref={partnerListPath(guard.locale)}
          error={mapCatalogError(error, guard.locale)}
          locale={guard.locale}
          submitLabel={copy.create}
        />
      </AdminPageShell>,
      {
        locale: guard.locale,
        title: copy.newPartnerTitle,
      },
    );
  }
});

export default createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const copy = getAdminCopy(guard.locale);

  return renderAdminPage(
    c,
    <AdminPageShell
      breadcrumbs={[
        { label: copy.navDashboard, href: adminDashboardPath(guard.locale) },
        { label: copy.partnersTitle, href: adminPartnersPath(guard.locale) },
        { label: copy.newPartnerTitle },
      ]}
      locale={guard.locale}
      title={copy.newPartnerTitle}
    >
      <PartnerForm
        action={`/${guard.locale}/admin/partners/new`}
        cancelHref={partnerListPath(guard.locale)}
        locale={guard.locale}
        submitLabel={copy.create}
      />
    </AdminPageShell>,
    {
      locale: guard.locale,
      title: copy.newPartnerTitle,
    },
  );
});
