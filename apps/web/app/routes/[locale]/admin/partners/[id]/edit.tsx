import { getPartnerById, updatePartner } from "@unveiled/db";
import { ensureImageVariantsUploaded } from "@unveiled/db/catalog/images";
import { buildVariantUrl } from "@unveiled/images/urls";
import type { Context } from "hono";
import { createRoute } from "honox/factory";

import { AdminPageShell, adminPartnersPath } from "../../../../../components/admin/AdminPageShell";
import { partnerListPath } from "../../../../../components/admin/PartnerForm";
import { NotFoundPage } from "../../../../../components/NotFoundPage";
import PartnerForm from "../../../../../islands/PartnerForm";
import { getAdminCopy } from "../../../../../lib/admin-content";
import { renderAdminPage } from "../../../../../lib/admin-render";
import {
  guardAdminRoute,
  mapCatalogError,
  parsePartnerFormBody,
} from "../../../../../lib/admin-route";
import { getAuthOptions } from "../../../../../lib/auth";
import type { Locale } from "../../../../../lib/locale";

function buildPartnerLogoUrl(logoImageId: string | null): string | null {
  if (!logoImageId) {
    return null;
  }

  try {
    return buildVariantUrl(logoImageId, "small-320.jpg");
  } catch {
    return null;
  }
}

function renderEditPage(
  c: Context,
  options: {
    locale: Locale;
    partnerId: string;
    error?: string | null;
    defaults?: {
      name: string;
      contactEmail: string;
      address: string;
      currentLogoUrl?: string | null;
    };
  },
) {
  const copy = getAdminCopy(options.locale);

  return renderAdminPage(
    c,
    <AdminPageShell
      eyebrow={copy.pageEyebrow}
      breadcrumbs={[
        { label: copy.partnersTitle, href: adminPartnersPath(options.locale) },
        { label: copy.editPartnerTitle },
      ]}
      title={copy.editPartnerTitle}
    >
      <PartnerForm
        action={`/${options.locale}/admin/partners/${options.partnerId}/edit`}
        cancelHref={partnerListPath(options.locale)}
        defaults={options.defaults}
        error={options.error ?? null}
        isEdit
        locale={options.locale}
        submitLabel={copy.save}
      />
    </AdminPageShell>,
    {
      locale: options.locale,
      title: copy.editPartnerTitle,
    },
  );
}

export const POST = createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const partnerId = c.req.param("id");
  if (!partnerId) {
    c.status(404);
    return c.render(<NotFoundPage locale={guard.locale} />, {
      locale: guard.locale,
      robots: "noindex",
      title: "Not Found — Unveiled Berlin",
    });
  }

  const { db } = getAuthOptions();
  const existing = await getPartnerById(db, partnerId);
  if (!existing) {
    c.status(404);
    return c.render(<NotFoundPage locale={guard.locale} />, {
      locale: guard.locale,
      robots: "noindex",
      title: "Not Found — Unveiled Berlin",
    });
  }

  let values: Awaited<ReturnType<typeof parsePartnerFormBody>> | undefined;

  try {
    const body = (await c.req.parseBody()) as Record<string, string | File | (string | File)[]>;
    values = await parsePartnerFormBody(body);

    await updatePartner(db, partnerId, {
      name: values.name,
      address: values.address,
      contactEmail: values.contactEmail,
      logoUpload: values.logoUpload,
      logoPrebuilt: values.logoPrebuilt,
      uploadedBy: guard.session.user.id,
    });

    return c.redirect(partnerListPath(guard.locale), 302);
  } catch (error) {
    if (existing.logoImageId) {
      await ensureImageVariantsUploaded(db, existing.logoImageId);
    }

    return renderEditPage(c, {
      locale: guard.locale,
      partnerId,
      error: mapCatalogError(error, guard.locale),
      defaults: {
        name: values?.name ?? existing.name,
        contactEmail: values?.contactEmail ?? existing.contactEmail,
        address: values?.address ?? existing.address,
        currentLogoUrl: buildPartnerLogoUrl(existing.logoImageId),
      },
    });
  }
});

export default createRoute(async (c) => {
  const guard = await guardAdminRoute(c);
  if (!guard.ok) {
    return guard.response;
  }

  const partnerId = c.req.param("id");
  if (!partnerId) {
    c.status(404);
    return c.render(<NotFoundPage locale={guard.locale} />, {
      locale: guard.locale,
      robots: "noindex",
      title: "Not Found — Unveiled Berlin",
    });
  }

  const { db } = getAuthOptions();
  const partner = await getPartnerById(db, partnerId);
  if (!partner) {
    c.status(404);
    return c.render(<NotFoundPage locale={guard.locale} />, {
      locale: guard.locale,
      robots: "noindex",
      title: "Not Found — Unveiled Berlin",
    });
  }

  if (partner.logoImageId) {
    await ensureImageVariantsUploaded(db, partner.logoImageId);
  }

  return renderEditPage(c, {
    locale: guard.locale,
    partnerId,
    defaults: {
      name: partner.name,
      contactEmail: partner.contactEmail,
      address: partner.address,
      currentLogoUrl: buildPartnerLogoUrl(partner.logoImageId),
    },
  });
});
