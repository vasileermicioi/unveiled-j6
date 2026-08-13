import { getPartnerById, updatePartner } from "@unveiled/db";
import { ensureImageVariantsUploaded, getImageCredit } from "@unveiled/db/catalog/images";
import { buildVariantUrl, readImagePublicBaseUrl } from "@unveiled/images/urls";
import type { Context } from "hono";
import { createRoute } from "honox/factory";

import { AdminPageShell, adminPartnersPath } from "../../../../../components/admin/AdminPageShell";
import {
  type PartnerFormDefaults,
  partnerListPath,
} from "../../../../../components/admin/PartnerForm";
import { NotFoundPage } from "../../../../../components/NotFoundPage";
import PartnerForm from "../../../../../islands/PartnerForm";
import { getAdminCopy } from "../../../../../lib/admin-content";
import { renderAdminPage } from "../../../../../lib/admin-render";
import {
  guardAdminRoute,
  mapCatalogError,
  openingHoursFormToWriteInput,
  openingHoursWeekToFormDays,
  parsePartnerFormBody,
} from "../../../../../lib/admin-route";
import { getAuthOptions } from "../../../../../lib/auth";
import type { Locale } from "../../../../../lib/locale";

function buildPartnerLogoUrl(logoImageId: string): string | null {
  try {
    return buildVariantUrl(logoImageId, "small-320.webp");
  } catch {
    return null;
  }
}

function resolveImagePublicBaseUrl(): string | null {
  try {
    return readImagePublicBaseUrl();
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
    defaults?: PartnerFormDefaults;
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
    const hours = openingHoursFormToWriteInput(values.hasOpeningHours, values.openingHoursDays);

    await updatePartner(db, partnerId, {
      name: values.name,
      street: values.street,
      houseNumber: values.houseNumber,
      addressLine2: values.addressLine2,
      zipCode: values.zipCode,
      country: values.country,
      city: values.city,
      contactEmail: values.contactEmail,
      hasOpeningHours: hours.hasOpeningHours,
      openingHours: hours.openingHours,
      barrierFree: values.barrierFree,
      logoUpload: values.logoUpload,
      logoPrebuilt: values.logoPrebuilt,
      logoCredit: values.logoCredit,
      uploadedBy: guard.session.user.id,
    });

    return c.redirect(partnerListPath(guard.locale), 302);
  } catch (error) {
    await ensureImageVariantsUploaded(db, existing.logoImageId);

    return renderEditPage(c, {
      locale: guard.locale,
      partnerId,
      error: mapCatalogError(error, guard.locale),
      defaults: {
        name: values?.name ?? existing.name,
        contactEmail: values?.contactEmail ?? existing.contactEmail,
        street: values?.street ?? existing.street,
        houseNumber: values?.houseNumber ?? existing.houseNumber,
        addressLine2: values?.addressLine2 ?? existing.addressLine2,
        zipCode: values?.zipCode ?? existing.zipCode,
        country: values?.country ?? existing.country,
        city: values?.city ?? existing.city,
        hasOpeningHours: values?.hasOpeningHours ?? existing.hasOpeningHours,
        openingHoursDays:
          values?.openingHoursDays ?? openingHoursWeekToFormDays(existing.openingHours),
        barrierFree: values?.barrierFree ?? existing.barrierFree,
        currentLogoUrl: buildPartnerLogoUrl(existing.logoImageId),
        currentLogoImageId: existing.logoImageId,
        currentLogoCredit: values?.logoCredit ?? (await getImageCredit(db, existing.logoImageId)),
        imagePublicBaseUrl: resolveImagePublicBaseUrl(),
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

  await ensureImageVariantsUploaded(db, partner.logoImageId);
  const currentLogoCredit = await getImageCredit(db, partner.logoImageId);

  return renderEditPage(c, {
    locale: guard.locale,
    partnerId,
    defaults: {
      name: partner.name,
      contactEmail: partner.contactEmail,
      street: partner.street,
      houseNumber: partner.houseNumber,
      addressLine2: partner.addressLine2,
      zipCode: partner.zipCode,
      country: partner.country,
      city: partner.city,
      hasOpeningHours: partner.hasOpeningHours,
      openingHoursDays: openingHoursWeekToFormDays(partner.openingHours),
      barrierFree: partner.barrierFree,
      currentLogoUrl: buildPartnerLogoUrl(partner.logoImageId),
      currentLogoImageId: partner.logoImageId,
      currentLogoCredit,
      imagePublicBaseUrl: resolveImagePublicBaseUrl(),
    },
  });
});
