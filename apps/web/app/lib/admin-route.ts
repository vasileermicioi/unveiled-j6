import type { AppSession } from "@unveiled/auth";
import { CatalogValidationError, PostalValidationError } from "@unveiled/db";
import type { PrebuiltImageVariantsInput } from "@unveiled/images";
import { ImageValidationError } from "@unveiled/images/errors";
import type { Context } from "hono";

import { getAdminCopy, mapCatalogErrorCode } from "./admin-content";
import { parseEventFormBody, parseSeriesSlots } from "./admin-event-form";
import { parsePrebuiltImageVariants } from "./admin-prebuilt-image";
import { getSession } from "./auth";
import { buildLoginRedirectUrl } from "./auth-middleware";
import type { Locale } from "./locale";
import { isValidLocale } from "./locale";
import {
  type PartnerOpeningHoursDaysForm,
  parseOpeningHoursFormFromBody,
} from "./partner-opening-hours-form";

export type {
  AdminEventBookingsIndexQuery,
  AdminEventBookingsListQuery,
  AdminEventsListQuery,
  AdminListQuery,
  AdminListSortDir,
  AdminListSortKey,
  AdminPartnersListQuery,
  AdminUsersListQuery,
  AdminWaitlistListQuery,
} from "./admin-list";
export {
  adminEventBookingsListPageRedirectPath,
  adminListPageRedirectPath,
  adminWaitlistListPageRedirectPath,
  buildAdminEventBookingsListQueryString,
  buildAdminListQueryString,
  buildAdminWaitlistQueryString,
  clampAdminListPage,
  isDefaultEventListSort,
  isDefaultPartnerListSort,
  parseAdminEventBookingsIndexQuery,
  parseAdminEventBookingsListQuery,
  parseAdminEventsListQuery,
  parseAdminListQuery,
  parseAdminPartnersListQuery,
  parseAdminUsersListQuery,
  parseAdminWaitlistListQuery,
} from "./admin-list";

export { mapAdminOpsError } from "./admin-ops-errors";
export { withAdminTxDb } from "./admin-ops-tx";

export type ParsedBody = Record<string, string | File | (string | File)[]>;

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

function isUploadBlob(value: unknown): value is File | Blob {
  return value instanceof File || value instanceof Blob;
}

function asFile(value: string | File | (string | File)[] | undefined): File | Blob | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      if (isUploadBlob(item) && item.size > 0) {
        return item;
      }
    }
    return undefined;
  }

  return isUploadBlob(value) ? value : undefined;
}

export type AdminGuardResult =
  | { ok: true; session: AppSession; locale: Locale }
  | { ok: false; response: Response };

export type PartnerFormValues = {
  name: string;
  contactEmail: string;
  street: string;
  houseNumber: string;
  addressLine2: string | null;
  zipCode: string;
  country?: string;
  city?: string;
  hasOpeningHours: boolean;
  openingHoursDays: PartnerOpeningHoursDaysForm;
  barrierFree: boolean | null;
  /** Posted `bank_details`; empty string clears on save. */
  bankDetails: string;
  logoUpload: Buffer | null;
  logoPrebuilt: PrebuiltImageVariantsInput | null;
  /** Posted `image_credit`; empty string clears on keep-file. */
  logoCredit: string;
};

export type {
  PartnerOpeningHoursDayForm,
  PartnerOpeningHoursDaysForm,
} from "./partner-opening-hours-form";
export {
  emptyOpeningHoursDaysForm,
  normalizeTimeInput,
  openingHoursFormToWriteInput,
  openingHoursWeekToFormDays,
  parseOpeningHoursFormFromBody,
} from "./partner-opening-hours-form";

function getLocaleParam(value: string | undefined): Locale {
  return value && isValidLocale(value) ? value : "de";
}

export type { EventFormValues, SeriesSlotMode } from "./admin-event-form";
export {
  eventFormValuesToDateTime,
  eventFormValuesToDateTimes,
  formatEventDateInput,
  formatEventDateTime,
  formatEventTimeInput,
  MANUAL_SLOT_ROWS,
  MAX_SERIES_SLOTS,
  parseBerlinDateTime,
  parseIsoSlotDates,
} from "./admin-event-form";

export async function parseEventFormBodyFromRequest(body: ParsedBody) {
  return parseEventFormBody(body, asString, asFile);
}

export function parseSeriesSlotsFromBody(body: ParsedBody) {
  return parseSeriesSlots(body, asString);
}

export async function guardAdminRoute(c: Context): Promise<AdminGuardResult> {
  const locale = getLocaleParam(c.req.param("locale"));
  const session = await getSession(c);
  const pathname = new URL(c.req.url).pathname;

  if (!session) {
    return { ok: false, response: c.redirect(buildLoginRedirectUrl(locale, pathname), 302) };
  }

  if (session.user.role !== "ADMIN") {
    return { ok: false, response: c.redirect(`/${locale}`, 302) };
  }

  return { ok: true, session, locale };
}

export async function parsePartnerFormBody(body: ParsedBody): Promise<PartnerFormValues> {
  const name = asString(body.name)?.trim() ?? "";
  const contactEmail = asString(body.contact_email)?.trim() ?? "";
  const street = asString(body.street)?.trim() ?? "";
  const houseNumber = asString(body.house_number)?.trim() ?? "";
  const addressLine2 = asString(body.address_line2)?.trim() || null;
  const zipCode = asString(body.zip_code)?.trim() ?? "";
  const country = asString(body.country)?.trim() || undefined;
  const city = asString(body.city)?.trim() || undefined;
  const logoPrebuilt = await parsePrebuiltImageVariants(body, asString, asFile);
  const { hasOpeningHours, openingHoursDays } = parseOpeningHoursFormFromBody(body, asString);
  const barrierFree = asString(body.barrier_free) === "on" ? true : null;

  let logoUpload: Buffer | null = null;
  if (!logoPrebuilt) {
    const logoFile = asFile(body.logo);
    if (logoFile && logoFile.size > 0) {
      logoUpload = Buffer.from(await logoFile.arrayBuffer());
    }
  }

  return {
    name,
    contactEmail,
    street,
    houseNumber,
    addressLine2,
    zipCode,
    country,
    city,
    hasOpeningHours,
    openingHoursDays,
    barrierFree,
    bankDetails: asString(body.bank_details)?.trim() ?? "",
    logoUpload,
    logoPrebuilt,
    logoCredit: asString(body.image_credit)?.trim() ?? "",
  };
}

function isImageStorageConfigError(error: Error): boolean {
  return (
    error.message.includes("S3_ENDPOINT") ||
    error.message.includes("S3_REGION") ||
    error.message.includes("S3_BUCKET") ||
    error.message.includes("S3_ACCESS_KEY_ID") ||
    error.message.includes("S3_SECRET_ACCESS_KEY") ||
    error.message.includes("IMAGE_PUBLIC_BASE_URL")
  );
}

export function mapCatalogError(error: unknown, locale: Locale): string {
  if (error instanceof PostalValidationError) {
    return getAdminCopy(locale).fieldErrors.zipCode;
  }

  if (error instanceof CatalogValidationError) {
    if (
      error.code === "MISSING_EVENT_IMAGE" &&
      error.message.toLowerCase().includes("partner logo")
    ) {
      return getAdminCopy(locale).fieldErrors.logo;
    }

    const field =
      error.code === "REQUIRED_FIELD" ? error.message.replace(/ is required$/, "") : undefined;

    return mapCatalogErrorCode(locale, error.code, field);
  }

  if (error instanceof ImageValidationError) {
    return error.message;
  }

  if (error instanceof Error && isImageStorageConfigError(error)) {
    return getAdminCopy(locale).imageStorageError;
  }

  // Surface unexpected runtime messages (e.g. R2/image storage) for admin operators.
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  return getAdminCopy(locale).genericError;
}
