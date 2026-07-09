"use client";

import { Button, Form, Input, Label, Link, Paragraph, Surface, TextField } from "@heroui/react";

import type { EventFeedQuery } from "../../lib/event-feed";
import { getEventFeedCopy } from "../../lib/event-feed-content";
import type { Locale } from "../../lib/locale";
import { AdminFormSelect, type AdminFormSelectOption } from "../admin/AdminFormSelect";

export type EventFeedFiltersProps = {
  locale: Locale;
  action: string;
  query: EventFeedQuery;
  categoryOptions: AdminFormSelectOption[];
  partnerOptions: AdminFormSelectOption[];
};

export function EventFeedFilters({
  locale,
  action,
  query,
  categoryOptions,
  partnerOptions,
}: EventFeedFiltersProps) {
  const copy = getEventFeedCopy(locale);
  const hasCustomDates = Boolean(query.from || query.to);
  const rangeFrom = query.from ?? query.to ?? "";
  const rangeTo = query.to ?? query.from ?? "";

  return (
    <Surface className="flex flex-col gap-4" variant="transparent">
      <Paragraph className="uppercase tracking-wide" size="sm">
        {copy.filtersTitle}
      </Paragraph>
      <Paragraph color="muted" size="sm">
        {hasCustomDates ? copy.dateRangeLabel(rangeFrom, rangeTo) : copy.todayScopeLabel}
      </Paragraph>

      <Form action={action} className="flex flex-col gap-4" method="get">
        <Surface className="grid gap-4 md:grid-cols-2" variant="transparent">
          <AdminFormSelect
            defaultSelectedKey={query.category}
            label={copy.categoryLabel}
            name="category"
            options={[{ id: "", label: copy.allCategories }, ...categoryOptions]}
            placeholder={copy.allCategories}
          />
          <AdminFormSelect
            defaultSelectedKey={query.partnerId}
            label={copy.partnerLabel}
            name="partnerId"
            options={[{ id: "", label: copy.allPartners }, ...partnerOptions]}
            placeholder={copy.allPartners}
          />
          <TextField className="w-full" defaultValue={query.from ?? ""} fullWidth name="from">
            <Label>{copy.from}</Label>
            <Input type="date" />
          </TextField>
          <TextField className="w-full" defaultValue={query.to ?? ""} fullWidth name="to">
            <Label>{copy.to}</Label>
            <Input type="date" />
          </TextField>
        </Surface>

        <Surface className="flex flex-wrap items-center gap-3" variant="transparent">
          <Button className="button button--primary button--md" type="submit">
            {copy.apply}
          </Button>
          <Link className="button button--secondary button--md" href={action}>
            {copy.reset}
          </Link>
        </Surface>
      </Form>
    </Surface>
  );
}
