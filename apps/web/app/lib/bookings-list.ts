import { BOOKINGS_PAGE_SIZE } from "@unveiled/db";

export type BookingsListQuery = {
  page: number;
};

export function parseBookingsListQuery(url: URL): BookingsListQuery {
  const rawPage = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;
  return { page };
}

export function buildBookingsListQueryString(query: { page?: number }): string {
  const params = new URLSearchParams();
  if (query.page && query.page > 1) {
    params.set("page", String(query.page));
  }
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function clampBookingsListPage(
  page: number,
  total: number,
  pageSize = BOOKINGS_PAGE_SIZE,
): number {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  return Math.min(page, totalPages);
}

export function bookingsListPageRedirectPath(
  basePath: string,
  query: BookingsListQuery,
  total: number,
  pageSize = BOOKINGS_PAGE_SIZE,
): string | null {
  const effectivePage = clampBookingsListPage(query.page, total, pageSize);
  if (effectivePage === query.page) {
    return null;
  }
  return `${basePath}${buildBookingsListQueryString({ page: effectivePage })}`;
}

export { BOOKINGS_PAGE_SIZE };
