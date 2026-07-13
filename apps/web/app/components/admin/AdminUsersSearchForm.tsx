"use client";

import { Button, Form, Input, Label, TextField } from "@heroui/react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";
import { AdminFormSelect } from "./AdminFormSelect";

type AdminUsersSearchFormProps = {
  locale: Locale;
  action: string;
  defaultQuery?: string;
  defaultRole?: string;
};

export function AdminUsersSearchForm({
  locale,
  action,
  defaultQuery = "",
  defaultRole = "",
}: AdminUsersSearchFormProps) {
  const copy = getAdminCopy(locale);

  return (
    <Form action={action} className="flex flex-col gap-3 sm:flex-row sm:items-end" method="get">
      <TextField className="w-full sm:max-w-md" defaultValue={defaultQuery} fullWidth name="q">
        <Label htmlFor="admin-users-search">{copy.usersSearchPlaceholder}</Label>
        <Input id="admin-users-search" placeholder={copy.usersSearchPlaceholder} type="search" />
      </TextField>
      <AdminFormSelect
        defaultSelectedKey={defaultRole || "__all__"}
        label={copy.usersRoleLabel}
        name="role"
        options={[
          { id: "__all__", label: copy.usersRoleAll },
          { id: "USER", label: copy.usersRoleUser },
          { id: "ADMIN", label: copy.usersRoleAdmin },
          { id: "PARTNER", label: copy.usersRolePartner },
        ]}
        placeholder={copy.usersRoleAll}
      />
      <Button className="button button--secondary button--md" type="submit">
        {copy.searchSubmit}
      </Button>
    </Form>
  );
}
