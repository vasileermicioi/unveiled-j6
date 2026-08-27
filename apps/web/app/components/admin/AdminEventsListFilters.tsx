import { Button, Form, Input, Label, Link, Surface, TextField } from "@heroui/react";

import { getAdminCopy, getEventSubtitleLanguageOptions } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

import { AdminFormSelect } from "./AdminFormSelect";

type AdminEventsListFiltersProps = {
  locale: Locale;
  action: string;
  title: string;
  partner: string;
  language: string;
  preserveParams?: Record<string, string>;
  resetHref?: string;
};

export function AdminEventsListFilters({
  locale,
  action,
  title,
  partner,
  language,
  preserveParams,
  resetHref,
}: AdminEventsListFiltersProps) {
  const copy = getAdminCopy(locale);
  const languageOptions = getEventSubtitleLanguageOptions(locale);

  return (
    <Form
      action={action}
      className="admin-list-filters flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end"
      method="get"
    >
      {preserveParams
        ? Object.entries(preserveParams).map(([name, value]) => (
            <Input key={name} name={name} type="hidden" value={value} />
          ))
        : null}
      <TextField
        className="w-full min-w-0 flex-1 lg:min-w-[12rem]"
        defaultValue={title}
        fullWidth
        name="title"
      >
        <Label htmlFor="admin-events-title">{copy.eventsTitleFilter}</Label>
        <Input id="admin-events-title" placeholder={copy.eventsTitleFilter} type="search" />
      </TextField>
      <TextField
        className="w-full min-w-0 flex-1 lg:min-w-[12rem]"
        defaultValue={partner}
        fullWidth
        name="partner"
      >
        <Label htmlFor="admin-events-partner">{copy.eventsPartnerFilter}</Label>
        <Input id="admin-events-partner" placeholder={copy.eventsPartnerFilter} type="search" />
      </TextField>
      <AdminFormSelect
        className="w-full max-w-xs shrink-0 lg:w-52"
        defaultSelectedKey={language}
        label={copy.eventsLanguageFilter}
        name="language"
        options={languageOptions}
        placeholder={copy.eventsLanguageAll}
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
    </Form>
  );
}
