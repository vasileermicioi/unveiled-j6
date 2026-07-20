import { Button, Form, Input, Label, Link, Paragraph, Surface, TextField } from "@heroui/react";

import type { EventFeedQuery } from "../../lib/event-feed";
import { getEventFeedCopy } from "../../lib/event-feed-content";
import type { Locale } from "../../lib/locale";
import type { AdminFormSelectOption } from "../admin/AdminFormSelect";

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
    <Surface className="event-feed-filters flex flex-col gap-2" variant="transparent">
      <Surface
        className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"
        variant="transparent"
      >
        <Paragraph className="uppercase tracking-wide" size="sm">
          {copy.filtersTitle}
        </Paragraph>
        <Paragraph color="muted" size="sm">
          {hasCustomDates ? copy.dateRangeLabel(rangeFrom, rangeTo) : copy.upcomingScopeLabel}
        </Paragraph>
      </Surface>

      <Form action={action} className="flex flex-col gap-3" method="get">
        <Surface
          className="grid items-end gap-3 sm:grid-cols-2 lg:grid-cols-4"
          variant="transparent"
        >
          <Surface className="event-feed-filters__field flex w-full flex-col" variant="transparent">
            <Label htmlFor="event-feed-category">{copy.categoryLabel}</Label>
            <select
              className="event-feed-filters__select"
              defaultValue={query.category ?? ""}
              id="event-feed-category"
              name="category"
            >
              <option value="">{copy.allCategories}</option>
              {categoryOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </Surface>

          <Surface className="event-feed-filters__field flex w-full flex-col" variant="transparent">
            <Label htmlFor="event-feed-partner">{copy.partnerLabel}</Label>
            <select
              className="event-feed-filters__select"
              defaultValue={query.partnerId ?? ""}
              id="event-feed-partner"
              name="partnerId"
            >
              <option value="">{copy.allPartners}</option>
              {partnerOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </Surface>

          <TextField className="w-full" defaultValue={query.from ?? ""} fullWidth name="from">
            <Label>{copy.from}</Label>
            <Input type="date" />
          </TextField>
          <TextField className="w-full" defaultValue={query.to ?? ""} fullWidth name="to">
            <Label>{copy.to}</Label>
            <Input type="date" />
          </TextField>
        </Surface>

        <Surface className="flex flex-wrap items-center gap-2" variant="transparent">
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
