import { MEMBER_FEED_PAGE_SIZE } from "@unveiled/db";

export type EventFeedQuery = {
  category?: string;
  partnerId?: string;
  /** YYYY-MM-DD Europe/Berlin calendar day */
  from?: string;
  /** YYYY-MM-DD Europe/Berlin calendar day */
  to?: string;
  page: number;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function parseOptionalParam(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function parseDateParam(value: string | null): string | undefined {
  const trimmed = parseOptionalParam(value);
  if (!trimmed || !DATE_RE.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}

export function parseEventFeedQuery(url: URL): EventFeedQuery {
  const rawPage = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const page = Number.isFinite(rawPage) && rawPage > 0 ? rawPage : 1;

  return {
    category: parseOptionalParam(url.searchParams.get("category")),
    partnerId: parseOptionalParam(url.searchParams.get("partnerId")),
    from: parseDateParam(url.searchParams.get("from")),
    to: parseDateParam(url.searchParams.get("to")),
    page,
  };
}

export function buildEventFeedQueryString(query: {
  category?: string;
  partnerId?: string;
  from?: string;
  to?: string;
  page?: number;
}): string {
  const params = new URLSearchParams();

  if (query.category?.trim()) {
    params.set("category", query.category.trim());
  }
  if (query.partnerId?.trim()) {
    params.set("partnerId", query.partnerId.trim());
  }
  if (query.from?.trim()) {
    params.set("from", query.from.trim());
  }
  if (query.to?.trim()) {
    params.set("to", query.to.trim());
  }
  if (query.page && query.page > 1) {
    params.set("page", String(query.page));
  }

  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function clampEventFeedPage(page: number, total: number): number {
  const totalPages = Math.max(1, Math.ceil(total / MEMBER_FEED_PAGE_SIZE));
  return Math.min(page, totalPages);
}

export function eventFeedPageRedirectPath(
  basePath: string,
  query: EventFeedQuery,
  total: number,
): string | null {
  const effectivePage = clampEventFeedPage(query.page, total);
  if (effectivePage === query.page) {
    return null;
  }

  return `${basePath}${buildEventFeedQueryString({
    category: query.category,
    partnerId: query.partnerId,
    from: query.from,
    to: query.to,
    page: effectivePage,
  })}`;
}

export { MEMBER_FEED_PAGE_SIZE };
