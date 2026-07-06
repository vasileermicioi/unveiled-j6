import { Button, Form, Link, Paragraph, Surface } from "@heroui/react";
import { deletePartner, getPartnerById } from "@unveiled/db";
import type { Context } from "hono";
import { createRoute } from "honox/factory";

import {
  AdminPageShell,
  adminDashboardPath,
  adminPartnersPath,
} from "../../../../../components/admin/AdminPageShell";
import { partnerListPath } from "../../../../../components/admin/PartnerForm";
import { NotFoundPage } from "../../../../../components/NotFoundPage";
import { getAdminCopy } from "../../../../../lib/admin-content";
import { renderAdminPage } from "../../../../../lib/admin-render";
import { guardAdminRoute, mapCatalogError } from "../../../../../lib/admin-route";
import { getAuthOptions } from "../../../../../lib/auth";
import type { Locale } from "../../../../../lib/locale";

function renderDeletePage(
  c: Context,
  options: {
    locale: Locale;
    partnerId: string;
    partnerName: string;
    error?: string | null;
  },
) {
  const copy = getAdminCopy(options.locale);

  return renderAdminPage(
    c,
    <AdminPageShell
      breadcrumbs={[
        { label: copy.navDashboard, href: adminDashboardPath(options.locale) },
        { label: copy.partnersTitle, href: adminPartnersPath(options.locale) },
        { label: copy.deletePartnerTitle },
      ]}
      locale={options.locale}
      title={copy.deletePartnerTitle}
    >
      {options.error ? <Paragraph>{options.error}</Paragraph> : null}
      <Paragraph>{copy.deletePartnerBody(options.partnerName)}</Paragraph>
      <Surface className="flex flex-col gap-3 sm:flex-row sm:items-center" variant="transparent">
        <Form
          action={`/${options.locale}/admin/partners/${options.partnerId}/delete`}
          method="post"
        >
          <Button className="button button--primary button--md" type="submit">
            {copy.deleteConfirm}
          </Button>
        </Form>
        <Link
          className="button button--secondary button--md"
          href={partnerListPath(options.locale)}
        >
          {copy.cancel}
        </Link>
      </Surface>
    </AdminPageShell>,
    {
      locale: options.locale,
      title: copy.deletePartnerTitle,
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
    await deletePartner(db, partnerId);
    return c.redirect(partnerListPath(guard.locale), 302);
  } catch (error) {
    return renderDeletePage(c, {
      locale: guard.locale,
      partnerId,
      partnerName: existing.name,
      error: mapCatalogError(error, guard.locale),
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

  return renderDeletePage(c, {
    locale: guard.locale,
    partnerId,
    partnerName: partner.name,
  });
});
