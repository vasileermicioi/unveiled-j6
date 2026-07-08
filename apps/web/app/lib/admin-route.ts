import type { AppSession } from "@unveiled/auth";
import { CatalogValidationError } from "@unveiled/db";
import { ImageValidationError } from "@unveiled/images/errors";
import type { Context } from "hono";

import { getAdminCopy, mapCatalogErrorCode } from "./admin-content";
import { parseEventFormBody, parseSeriesSlots } from "./admin-event-form";
import { getSession } from "./auth";
import { buildLoginRedirectUrl } from "./auth-middleware";
import type { Locale } from "./locale";
import { isValidLocale } from "./locale";

export type { AdminListQuery } from "./admin-list";
export { buildAdminListQueryString, parseAdminListQuery } from "./admin-list";

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
    const first = value[0];
    return isUploadBlob(first) ? first : undefined;
  }

  return isUploadBlob(value) ? value : undefined;
}

export type AdminGuardResult =
  | { ok: true; session: AppSession; locale: Locale }
  | { ok: false; response: Response };

export type PartnerFormValues = {
  name: string;
  contactEmail: string;
  address: string;
  logoUpload: Buffer | null;
};

function getLocaleParam(value: string | undefined): Locale {
  return value && isValidLocale(value) ? value : "de";
}

export type { EventFormValues, SeriesSlotMode } from "./admin-event-form";
export {
  eventFormValuesToDateTime,
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
  const address = asString(body.address)?.trim() ?? "";

  const logoFile = asFile(body.logo);
  let logoUpload: Buffer | null = null;
  if (logoFile && logoFile.size > 0) {
    logoUpload = Buffer.from(await logoFile.arrayBuffer());
  }

  return {
    name,
    contactEmail,
    address,
    logoUpload,
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
  if (error instanceof CatalogValidationError) {
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

  return getAdminCopy(locale).genericError;
}
