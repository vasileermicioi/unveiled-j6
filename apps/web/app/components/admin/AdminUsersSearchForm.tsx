import { Button, Form, Input, Label, Link, Surface, TextField } from "@heroui/react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

import { AdminFormSelect } from "./AdminFormSelect";

type AdminUsersSearchFormProps = {
  locale: Locale;
  action: string;
  defaultQuery?: string;
  defaultRole?: string;
  defaultSubscription?: string;
  /** Hidden GET fields preserved across filter submit (e.g. sort/dir). */
  preserveParams?: Record<string, string>;
  /** Clears filters + sort when present (shown beside submit). */
  resetHref?: string;
};

export function AdminUsersSearchForm({
  locale,
  action,
  defaultQuery = "",
  defaultRole = "",
  defaultSubscription = "",
  preserveParams,
  resetHref,
}: AdminUsersSearchFormProps) {
  const copy = getAdminCopy(locale);

  return (
    <Form action={action} className="admin-list-filters flex flex-col gap-3" method="get">
      {preserveParams
        ? Object.entries(preserveParams).map(([name, value]) => (
            <Input key={name} name={name} type="hidden" value={value} />
          ))
        : null}
      <Surface
        className="flex w-full flex-col gap-3 lg:flex-row lg:items-end"
        variant="transparent"
      >
        <TextField
          className="w-full min-w-0 flex-1 lg:min-w-[18rem]"
          defaultValue={defaultQuery}
          fullWidth
          name="q"
        >
          <Label htmlFor="admin-users-search">{copy.usersSearchPlaceholder}</Label>
          <Input id="admin-users-search" placeholder={copy.usersSearchPlaceholder} type="search" />
        </TextField>
        <AdminFormSelect
          className="w-full max-w-xs shrink-0 lg:w-44"
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
        <AdminFormSelect
          className="w-full max-w-xs shrink-0 lg:w-44"
          defaultSelectedKey={defaultSubscription || "__all__"}
          label={copy.usersSubscriptionLabel}
          name="subscription"
          options={[
            { id: "__all__", label: copy.usersSubscriptionAll },
            { id: "ACTIVE", label: "ACTIVE" },
            { id: "CANCELLED_PENDING", label: "CANCELLED_PENDING" },
            { id: "INACTIVE", label: "INACTIVE" },
            { id: "PAST_DUE", label: "PAST_DUE" },
            { id: "UNPAID", label: "UNPAID" },
            { id: "NONE", label: copy.usersSubscriptionNone },
          ]}
          placeholder={copy.usersSubscriptionAll}
        />
        <Surface className="flex shrink-0 flex-wrap gap-2" variant="transparent">
          <Button className="button button--secondary button--md shrink-0" type="submit">
            {copy.searchSubmit}
          </Button>
          {resetHref ? (
            <Link className="button button--secondary button--md shrink-0" href={resetHref}>
              {copy.resetFilters}
            </Link>
          ) : null}
        </Surface>
      </Surface>
    </Form>
  );
}
