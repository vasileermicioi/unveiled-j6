"use client";

import { Link, Paragraph, Surface } from "@heroui/react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

type AdminPaginationProps = {
  locale: Locale;
  basePath: string;
  page: number;
  total: number;
  pageSize: number;
  queryString: string;
};

export function AdminPagination({
  locale,
  basePath,
  page,
  total,
  pageSize,
  queryString,
}: AdminPaginationProps) {
  const copy = getAdminCopy(locale);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const previousHref = page > 1 ? `${basePath}${buildPageQuery(queryString, page - 1)}` : undefined;
  const nextHref =
    page < totalPages ? `${basePath}${buildPageQuery(queryString, page + 1)}` : undefined;

  return (
    <Surface
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
      variant="transparent"
    >
      <Paragraph color="muted" size="sm">
        {copy.paginationShowing(from, to, total)}
      </Paragraph>
      <Surface className="flex items-center gap-2" variant="transparent">
        {previousHref ? (
          <Link className="button button--secondary button--md" href={previousHref}>
            {copy.paginationPrevious}
          </Link>
        ) : null}
        {nextHref ? (
          <Link className="button button--secondary button--md" href={nextHref}>
            {copy.paginationNext}
          </Link>
        ) : null}
      </Surface>
    </Surface>
  );
}

function buildPageQuery(queryString: string, page: number): string {
  const params = new URLSearchParams(queryString.replace(/^\?/, ""));
  if (page <= 1) {
    params.delete("page");
  } else {
    params.set("page", String(page));
  }

  const next = params.toString();
  return next ? `?${next}` : "";
}
