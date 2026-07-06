import type { AppSession } from "@unveiled/auth";
import { CatalogValidationError } from "@unveiled/db";
import type { Context } from "hono";

import { ADMIN_PARTNERS_PAGE_SIZE, getAdminCopy, mapCatalogErrorCode } from "./admin-content";
import { getSession } from "./auth";
import { buildLoginRedirectUrl } from "./auth-middleware";
import type { Locale } from "./locale";
import { isValidLocale } from "./locale";

export type ParsedBody = Record<string, string | File | (string | File)[]>;

export type AdminGuardResult =
  | { ok: true; session: AppSession; locale: Locale }
  | { ok: false; response: Response };

export type PartnerFormValues = {
  name: string;
  contactEmail: string;
  address: string;
  logoUrl: string | null;
  logoUpload: Buffer | null;
};

export type AdminListQuery = {
  q: string;
  page: number;
  offset: number;
  limit: number;
};

function getLocaleParam(value: string | undefined): Locale {
  return value && isValidLocale(value) ? value : "de";
}

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

function asFile(value: string | File | (string | File)[] | undefined): File | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (Array.isArray(value)) {
    const first = value[0];
    return first instanceof File ? first : undefined;
  }

  return value instanceof File ? value : undefined;
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

export function parseAdminListQuery(url: URL): AdminListQuery {
  const q = url.searchParams.get("q")?.trim() ?? "";
  const rawPage = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  return {
    q,
    page,
    offset: (page - 1) * ADMIN_PARTNERS_PAGE_SIZE,
    limit: ADMIN_PARTNERS_PAGE_SIZE,
  };
}

export async function parsePartnerFormBody(body: ParsedBody): Promise<PartnerFormValues> {
  const name = asString(body.name)?.trim() ?? "";
  const contactEmail = asString(body.contact_email)?.trim() ?? "";
  const address = asString(body.address)?.trim() ?? "";
  const logoUrlRaw = asString(body.logo_url)?.trim();
  const logoUrl = logoUrlRaw ? logoUrlRaw : null;

  const logoFile = asFile(body.logo);
  let logoUpload: Buffer | null = null;
  if (logoFile && logoFile.size > 0) {
    logoUpload = Buffer.from(await logoFile.arrayBuffer());
  }

  return {
    name,
    contactEmail,
    address,
    logoUrl,
    logoUpload,
  };
}

export function mapCatalogError(error: unknown, locale: Locale): string {
  if (error instanceof CatalogValidationError) {
    const field =
      error.code === "REQUIRED_FIELD" ? error.message.replace(/ is required$/, "") : undefined;

    return mapCatalogErrorCode(locale, error.code, field);
  }

  return getAdminCopy(locale).genericError;
}

export function buildAdminListQueryString(options: { q?: string; page?: number }): string {
  const params = new URLSearchParams();
  if (options.q) {
    params.set("q", options.q);
  }
  if (options.page && options.page > 1) {
    params.set("page", String(options.page));
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}
