import { Link, Surface } from "@heroui/react";

export type AdminTableActionIcon = "edit" | "delete" | "download" | "gallery";

export type AdminTableAction = {
  href: string;
  label: string;
  icon: AdminTableActionIcon;
};

const ICON_SRC: Record<AdminTableActionIcon, string> = {
  edit: "/icons/admin-edit.svg",
  delete: "/icons/admin-delete.svg",
  download: "/icons/admin-download.svg",
  gallery: "/icons/admin-gallery.svg",
};

type AdminTableActionsProps = {
  actions: AdminTableAction[];
};

export function AdminTableActions({ actions }: AdminTableActionsProps) {
  return (
    <Surface className="admin-table-actions" variant="transparent">
      {actions.map((action) => (
        <Link
          aria-label={action.label}
          className="link admin-table-action"
          href={action.href}
          key={action.href}
        >
          <img alt="" className="admin-table-action__icon" src={ICON_SRC[action.icon]} />
        </Link>
      ))}
    </Surface>
  );
}
