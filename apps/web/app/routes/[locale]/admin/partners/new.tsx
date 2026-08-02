import { createPartner } from "@unveiled/db";
import { createRoute } from "honox/factory";

import { AdminPageShell, adminPartnersPath } from "../../../../components/admin/AdminPageShell";
import { partnerListPath } from "../../../../components/admin/PartnerForm";
import PartnerForm from "../../../../islands/PartnerForm";
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

  let values: Awaited<ReturnType<typeof parsePartnerFormBody>> | undefined;

  try {
    const body = (await c.req.parseBody()) as Record<string, string | File | (string | File)[]>;
    values = await parsePartnerFormBody(body);
    const { db } = getAuthOptions();

    await createPartner(db, {
      name: values.name,
      street: values.street,
      houseNumber: values.houseNumber,
      addressLine2: values.addressLine2,
      zipCode: values.zipCode,
      country: values.country,
      city: values.city,
      contactEmail: values.contactEmail,
      logoUpload: values.logoUpload,
      logoPrebuilt: values.logoPrebuilt,
      uploadedBy: guard.session.user.id,
    });

    return c.redirect(partnerListPath(guard.locale), 302);
  } catch (error) {
    return renderAdminPage(
      c,
      <AdminPageShell
        eyebrow={copy.pageEyebrow}
        breadcrumbs={[
          { label: copy.partnersTitle, href: adminPartnersPath(guard.locale) },
          { label: copy.newPartnerTitle },
        ]}
        title={copy.newPartnerTitle}
      >
        <PartnerForm
          action={`/${guard.locale}/admin/partners/new`}
          cancelHref={partnerListPath(guard.locale)}
          defaults={
            values
              ? {
                  name: values.name,
                  contactEmail: values.contactEmail,
                  street: values.street,
                  houseNumber: values.houseNumber,
                  addressLine2: values.addressLine2,
                  zipCode: values.zipCode,
                  country: values.country,
                  city: values.city,
                }
              : undefined
          }
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
      eyebrow={copy.pageEyebrow}
      breadcrumbs={[
        { label: copy.partnersTitle, href: adminPartnersPath(guard.locale) },
        { label: copy.newPartnerTitle },
      ]}
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
