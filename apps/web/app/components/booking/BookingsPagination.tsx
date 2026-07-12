import { Link, Paragraph, Surface } from "@heroui/react";

import type { MyTicketsCopy } from "../../lib/bookings-content";

type BookingsPaginationProps = {
  basePath: string;
  page: number;
  total: number;
  pageSize: number;
  copy: Pick<MyTicketsCopy, "paginationShowing" | "paginationPrevious" | "paginationNext">;
};

export function BookingsPagination({
  basePath,
  page,
  total,
  pageSize,
  copy,
}: BookingsPaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const previousHref = page > 1 ? `${basePath}${pageQuery(page - 1)}` : undefined;
  const nextHref = page < totalPages ? `${basePath}${pageQuery(page + 1)}` : undefined;

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

function pageQuery(page: number): string {
  return page <= 1 ? "" : `?page=${page}`;
}
