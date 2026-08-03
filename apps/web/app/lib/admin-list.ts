import type { EventSort, PartnerSort, UserRole } from "@unveiled/db";

import { ADMIN_LIST_PAGE_SIZE } from "./admin-content";

export type AdminListQuery = {
  q: string;
  page: number;
  offset: number;
  limit: number;
};

export type AdminListSortDir = "asc" | "desc";

export type AdminListSortKey = PartnerSort | EventSort;

export type AdminPartnersListQuery = AdminListQuery & {
  /** Present only for an explicit non-default sort selection. */
  sort?: PartnerSort;
  dir?: AdminListSortDir;
};

export type AdminEventsListQuery = AdminListQuery & {
  /** Dedicated admin-events title filter (preferred over combined `q`). */
  title: string;
  /** Dedicated admin-events partner-name filter. */
  partner: string;
  /** Spoken or subtitle language code (uppercase ISO 639-1), empty = all. */
  language: string;
  /** Present only for an explicit non-default sort selection. */
  sort?: EventSort;
  dir?: AdminListSortDir;
};

export type AdminUsersListQuery = AdminListQuery & {
  role?: UserRole;
};

export type AdminWaitlistListQuery = {
  eventId?: string;
  status?: "WAITING" | "PROMOTED" | "CANCELLED";
  page: number;
  offset: number;
  limit: number;
};

const USER_ROLES: ReadonlySet<string> = new Set(["USER", "ADMIN", "PARTNER"]);
const WAITLIST_STATUSES: ReadonlySet<string> = new Set(["WAITING", "PROMOTED", "CANCELLED"]);
const PARTNER_SORTS: ReadonlySet<string> = new Set(["name", "created", "events"]);
const EVENT_SORTS: ReadonlySet<string> = new Set([
  "title",
  "partner",
  "date",
  "created",
  "capacity",
]);
const LIST_DIRS: ReadonlySet<string> = new Set(["asc", "desc"]);
const LANGUAGE_CODE_RE = /^[A-Za-z]{2}$/;

/** Domain default for list sorts that use last-created — omit `sort`/`dir` from URLs when matching. */
export function isDefaultCreatedDescSort(
  sort: string | undefined,
  dir: AdminListSortDir | undefined,
): boolean {
  return !sort || (sort === "created" && (dir ?? "desc") === "desc");
}

/** Domain default for the partners list — omit `sort`/`dir` from URLs when matching this. */
export function isDefaultPartnerListSort(
  sort: PartnerSort | undefined,
  dir: AdminListSortDir | undefined,
): boolean {
  return isDefaultCreatedDescSort(sort, dir);
}

/** Domain default for the events list — omit `sort`/`dir` from URLs when matching this. */
export function isDefaultEventListSort(
  sort: EventSort | undefined,
  dir: AdminListSortDir | undefined,
): boolean {
  return isDefaultCreatedDescSort(sort, dir);
}

/** Effective sort when URL omits params (last created, newest first). */
export function effectivePartnerListSort(
  sort: PartnerSort | undefined,
  dir: AdminListSortDir | undefined,
): { sort: PartnerSort; dir: AdminListSortDir } {
  return {
    sort: sort ?? "created",
    dir: dir ?? "desc",
  };
}

/** Effective sort when URL omits params (last created, newest first). */
export function effectiveEventListSort(
  sort: EventSort | undefined,
  dir: AdminListSortDir | undefined,
): { sort: EventSort; dir: AdminListSortDir } {
  return {
    sort: sort ?? "created",
    dir: dir ?? "desc",
  };
}

/**
 * Next sort when a partner table column header is clicked.
 * Same column toggles direction; a new column uses name→asc, created/events→desc.
 */
export function nextPartnerColumnSort(
  currentSort: PartnerSort | undefined,
  currentDir: AdminListSortDir | undefined,
  column: PartnerSort,
): { sort: PartnerSort; dir: AdminListSortDir } {
  const active = effectivePartnerListSort(currentSort, currentDir);
  if (active.sort === column) {
    return { sort: column, dir: active.dir === "asc" ? "desc" : "asc" };
  }
  return { sort: column, dir: column === "name" ? "asc" : "desc" };
}

/**
 * Next sort when an event table column header is clicked.
 * Same column toggles direction; a new column uses title/partner→asc, date/created/capacity→desc.
 */
export function nextEventColumnSort(
  currentSort: EventSort | undefined,
  currentDir: AdminListSortDir | undefined,
  column: EventSort,
): { sort: EventSort; dir: AdminListSortDir } {
  const active = effectiveEventListSort(currentSort, currentDir);
  if (active.sort === column) {
    return { sort: column, dir: active.dir === "asc" ? "desc" : "asc" };
  }
  return {
    sort: column,
    dir: column === "title" || column === "partner" ? "asc" : "desc",
  };
}

export function parseAdminListQuery(url: URL): AdminListQuery {
  const q = url.searchParams.get("q")?.trim() ?? "";
  const rawPage = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  return {
    q,
    page,
    offset: (page - 1) * ADMIN_LIST_PAGE_SIZE,
    limit: ADMIN_LIST_PAGE_SIZE,
  };
}

export function parseAdminPartnersListQuery(url: URL): AdminPartnersListQuery {
  const base = parseAdminListQuery(url);
  const sortParam = url.searchParams.get("sort")?.trim() ?? "";
  const dirParam = url.searchParams.get("dir")?.trim() ?? "";
  const sort = PARTNER_SORTS.has(sortParam) ? (sortParam as PartnerSort) : undefined;
  const dir = LIST_DIRS.has(dirParam) ? (dirParam as AdminListSortDir) : undefined;

  // Require both params for an explicit sort; otherwise use domain default (omit sort).
  if (!sort || !dir || isDefaultPartnerListSort(sort, dir)) {
    return base;
  }

  return {
    ...base,
    sort,
    dir,
  };
}

export function parseAdminEventsListQuery(url: URL): AdminEventsListQuery {
  const base = parseAdminListQuery(url);
  const title = url.searchParams.get("title")?.trim() ?? "";
  const partner = url.searchParams.get("partner")?.trim() ?? "";
  const languageRaw = url.searchParams.get("language")?.trim() ?? "";
  const language = LANGUAGE_CODE_RE.test(languageRaw) ? languageRaw.toUpperCase() : "";
  const sortParam = url.searchParams.get("sort")?.trim() ?? "";
  const dirParam = url.searchParams.get("dir")?.trim() ?? "";
  const sort = EVENT_SORTS.has(sortParam) ? (sortParam as EventSort) : undefined;
  const dir = LIST_DIRS.has(dirParam) ? (dirParam as AdminListSortDir) : undefined;

  const withFilters: AdminEventsListQuery = {
    ...base,
    title,
    partner,
    language,
  };

  if (!sort || !dir || isDefaultEventListSort(sort, dir)) {
    return withFilters;
  }

  return {
    ...withFilters,
    sort,
    dir,
  };
}

export function parseAdminUsersListQuery(url: URL): AdminUsersListQuery {
  const base = parseAdminListQuery(url);
  const roleParam = url.searchParams.get("role")?.trim() ?? "";
  const role = USER_ROLES.has(roleParam) ? (roleParam as UserRole) : undefined;

  return {
    ...base,
    role,
  };
}

export function parseAdminWaitlistListQuery(url: URL): AdminWaitlistListQuery {
  const eventId = url.searchParams.get("eventId")?.trim() || undefined;
  const statusParam = url.searchParams.get("status")?.trim() ?? "";
  const status = WAITLIST_STATUSES.has(statusParam)
    ? (statusParam as AdminWaitlistListQuery["status"])
    : undefined;
  const rawPage = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  return {
    eventId,
    status,
    page,
    offset: (page - 1) * ADMIN_LIST_PAGE_SIZE,
    limit: ADMIN_LIST_PAGE_SIZE,
  };
}

export function clampAdminListPage(page: number, total: number, pageSize: number): number {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return Math.min(page, totalPages);
}

export function adminListPageRedirectPath(
  basePath: string,
  listQuery: AdminListQuery & {
    role?: string;
    title?: string;
    partner?: string;
    language?: string;
    sort?: AdminListSortKey;
    dir?: AdminListSortDir;
  },
  total: number,
): string | null {
  const effectivePage = clampAdminListPage(listQuery.page, total, listQuery.limit);
  if (effectivePage === listQuery.page) {
    return null;
  }

  return `${basePath}${buildAdminListQueryString({
    q: listQuery.q || undefined,
    title: listQuery.title,
    partner: listQuery.partner,
    language: listQuery.language,
    page: effectivePage,
    role: listQuery.role,
    sort: listQuery.sort,
    dir: listQuery.dir,
  })}`;
}

export function adminWaitlistListPageRedirectPath(
  basePath: string,
  listQuery: AdminWaitlistListQuery,
  total: number,
): string | null {
  const effectivePage = clampAdminListPage(listQuery.page, total, listQuery.limit);
  if (effectivePage === listQuery.page) {
    return null;
  }

  return `${basePath}${buildAdminWaitlistQueryString({
    eventId: listQuery.eventId,
    status: listQuery.status,
    page: effectivePage,
  })}`;
}

export function buildAdminListQueryString(options: {
  q?: string;
  title?: string;
  partner?: string;
  language?: string;
  page?: number;
  role?: string;
  sort?: AdminListSortKey;
  dir?: AdminListSortDir;
}): string {
  const params = new URLSearchParams();
  if (options.q) {
    params.set("q", options.q);
  }
  const title = options.title?.trim();
  if (title) {
    params.set("title", title);
  }
  const partner = options.partner?.trim();
  if (partner) {
    params.set("partner", partner);
  }
  const language = options.language?.trim();
  if (language) {
    params.set("language", language);
  }
  if (options.role) {
    params.set("role", options.role);
  }
  if (options.sort && options.dir && !isDefaultCreatedDescSort(options.sort, options.dir)) {
    params.set("sort", options.sort);
    params.set("dir", options.dir);
  }
  if (options.page && options.page > 1) {
    params.set("page", String(options.page));
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}

export function buildAdminWaitlistQueryString(options: {
  eventId?: string;
  status?: string;
  page?: number;
}): string {
  const params = new URLSearchParams();
  if (options.eventId) {
    params.set("eventId", options.eventId);
  }
  if (options.status) {
    params.set("status", options.status);
  }
  if (options.page && options.page > 1) {
    params.set("page", String(options.page));
  }

  const query = params.toString();
  return query ? `?${query}` : "";
}
