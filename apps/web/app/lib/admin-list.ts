import type { UserRole } from "@unveiled/db";

import { ADMIN_LIST_PAGE_SIZE } from "./admin-content";

export type AdminListQuery = {
  q: string;
  page: number;
  offset: number;
  limit: number;
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
  listQuery: AdminListQuery & { role?: string },
  total: number,
): string | null {
  const effectivePage = clampAdminListPage(listQuery.page, total, listQuery.limit);
  if (effectivePage === listQuery.page) {
    return null;
  }

  return `${basePath}${buildAdminListQueryString({
    q: listQuery.q || undefined,
    page: effectivePage,
    role: listQuery.role,
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
  page?: number;
  role?: string;
}): string {
  const params = new URLSearchParams();
  if (options.q) {
    params.set("q", options.q);
  }
  if (options.role) {
    params.set("role", options.role);
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
