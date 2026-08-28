import { Button, Form, Input, Label, Link, Surface, TextField } from "@heroui/react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

type AdminEventBookingsIndexFiltersProps = {
  locale: Locale;
  action: string;
  title: string;
  partner: string;
  resetHref?: string;
};

export function AdminEventBookingsIndexFilters({
  locale,
  action,
  title,
  partner,
  resetHref,
}: AdminEventBookingsIndexFiltersProps) {
  const copy = getAdminCopy(locale);

  return (
    <Form
      action={action}
      className="admin-list-filters flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end"
      method="get"
    >
      <TextField
        className="w-full min-w-0 flex-1 lg:min-w-[12rem]"
        defaultValue={title}
        fullWidth
        name="title"
      >
        <Label htmlFor="admin-bookings-title">{copy.eventsTitleFilter}</Label>
        <Input id="admin-bookings-title" placeholder={copy.eventsTitleFilter} type="search" />
      </TextField>
      <TextField
        className="w-full min-w-0 flex-1 lg:min-w-[12rem]"
        defaultValue={partner}
        fullWidth
        name="partner"
      >
        <Label htmlFor="admin-bookings-partner">{copy.eventsPartnerFilter}</Label>
        <Input id="admin-bookings-partner" placeholder={copy.eventsPartnerFilter} type="search" />
      </TextField>
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
    </Form>
  );
}
