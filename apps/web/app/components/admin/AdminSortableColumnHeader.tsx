import { Link, Table } from "@heroui/react";

import type { AdminListSortDir } from "../../lib/admin-list";

type AdminSortableColumnHeaderProps = {
  label: string;
  href: string;
  column: string;
  activeSort: string;
  activeDir: AdminListSortDir;
};

export function AdminSortableColumnHeader({
  label,
  href,
  column,
  activeSort,
  activeDir,
}: AdminSortableColumnHeaderProps) {
  const active = activeSort === column;
  const ariaSort = active ? (activeDir === "asc" ? "ascending" : "descending") : "none";

  return (
    <Table.Column isRowHeader>
      <Link
        aria-sort={ariaSort}
        className={
          active
            ? "admin-table__sort-link admin-table__sort-link--active"
            : "admin-table__sort-link"
        }
        data-sort-dir={active ? activeDir : undefined}
        href={href}
      >
        {label}
      </Link>
    </Table.Column>
  );
}
