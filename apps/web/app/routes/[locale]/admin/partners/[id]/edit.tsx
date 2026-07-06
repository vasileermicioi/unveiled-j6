import { getPartnerById, updatePartner } from "@unveiled/db";
import type { Context } from "hono";
import { createRoute } from "honox/factory";

import {
  AdminPageShell,
  adminDashboardPath,
  adminPartnersPath,
} from "../../../../../components/admin/AdminPageShell";
import { PartnerForm, partnerListPath } from "../../../../../components/admin/PartnerForm";
import { NotFoundPage } from "../../../../../components/NotFoundPage";
import { getAdminCopy } from "../../../../../lib/admin-content";
import { renderAdminPage } from "../../../../../lib/admin-render";
import {
  guardAdminRoute,
  mapCatalogError,
  parsePartnerFormBody,
} from "../../../../../lib/admin-route";
import { getAuthOptions } from "../../../../../lib/auth";
import type { Locale } from "../../../../../lib/locale";

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
    };
  },
) {
  const copy = getAdminCopy(options.locale);

  return renderAdminPage(
    c,
    <AdminPageShell
      breadcrumbs={[
        { label: copy.navDashboard, href: adminDashboardPath(options.locale) },
        { label: copy.partnersTitle, href: adminPartnersPath(options.locale) },
        { label: copy.editPartnerTitle },
      ]}
      locale={options.locale}
      title={copy.editPartnerTitle}
    >
      <PartnerForm
        action={`/${options.locale}/admin/partners/${options.partnerId}/edit`}
        cancelHref={partnerListPath(options.locale)}
        defaults={options.defaults}
        error={options.error ?? null}
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

  try {
    const body = (await c.req.parseBody()) as Record<string, string | File | (string | File)[]>;
    const values = await parsePartnerFormBody(body);

    await updatePartner(db, partnerId, {
      name: values.name,
      address: values.address,
      contactEmail: values.contactEmail,
      logoUpload: values.logoUpload,
      logoUrl: values.logoUrl,
      uploadedBy: guard.session.user.id,
    });

    return c.redirect(partnerListPath(guard.locale), 302);
  } catch (error) {
    return renderEditPage(c, {
      locale: guard.locale,
      partnerId,
      error: mapCatalogError(error, guard.locale),
      defaults: {
        name: existing.name,
        contactEmail: existing.contactEmail,
        address: existing.address,
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

  return renderEditPage(c, {
    locale: guard.locale,
    partnerId,
    defaults: {
      name: partner.name,
      contactEmail: partner.contactEmail,
      address: partner.address,
    },
  });
});
