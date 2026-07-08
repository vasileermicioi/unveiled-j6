import { ADMIN_LIST_PAGE_SIZE } from "./admin-content";

export type AdminListQuery = {
  q: string;
  page: number;
  offset: number;
  limit: number;
};

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
