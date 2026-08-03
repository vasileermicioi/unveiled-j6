"use client";

import { Button, Input, Label, Surface, TextField } from "@heroui/react";
import { useState } from "react";

import { getAdminCopy } from "../../lib/admin-content";
import { ALLOW_MULTI_DATETIME_UI } from "../../lib/admin-event-form";
import type { Locale } from "../../lib/locale";
import type { EventDateTimeRow } from "./event-admin-types";

type EventAdminDateInputProps = {
  locale: Locale;
  eventDate?: string;
  name?: string;
  label?: string;
  isRequired?: boolean;
};

type EventAdminTimeInputProps = {
  locale: Locale;
  eventTime?: string;
  name?: string;
  label?: string;
  defaultEmpty?: boolean;
};

type EventAdminDateTimeFieldsProps = {
  locale: Locale;
  eventDate?: string;
  eventTime?: string;
  dateName?: string;
  timeName?: string;
  isDateRequired?: boolean;
};

type EventAdminDateTimeListProps = {
  locale: Locale;
  rows?: EventDateTimeRow[];
  isDateRequired?: boolean;
};

const DEFAULT_EVENT_TIME = "19:30";

function getDefaultTimeValue(eventTime: string | undefined, defaultEmpty: boolean): string {
  if (eventTime) {
    return eventTime;
  }

  return defaultEmpty ? "" : DEFAULT_EVENT_TIME;
}

type RowState = EventDateTimeRow & { id: string };

function createRow(date = "", time = DEFAULT_EVENT_TIME): RowState {
  return {
    id: crypto.randomUUID(),
    date,
    time,
  };
}

function normalizeInitialRows(rows: EventDateTimeRow[] | undefined): RowState[] {
  if (rows && rows.length > 0) {
    const source = ALLOW_MULTI_DATETIME_UI ? rows : rows.slice(0, 1);
    return source.map((row) => createRow(row.date, row.time || DEFAULT_EVENT_TIME));
  }

  return [createRow()];
}

export function EventAdminDateInput({
  locale,
  eventDate,
  name = "event_date",
  label,
  isRequired = false,
}: EventAdminDateInputProps) {
  const copy = getAdminCopy(locale);

  return (
    <TextField
      className="admin-form__native-date-field w-full"
      defaultValue={eventDate ?? ""}
      fullWidth
      isRequired={isRequired}
      name={name}
    >
      <Label>{label ?? copy.eventDateLabel}</Label>
      <Input className="admin-form__native-input" type="date" />
    </TextField>
  );
}

export function EventAdminTimeInput({
  locale,
  eventTime,
  name = "event_time",
  label,
  defaultEmpty = false,
}: EventAdminTimeInputProps) {
  const copy = getAdminCopy(locale);

  return (
    <TextField
      className="admin-form__native-time-field w-full"
      defaultValue={getDefaultTimeValue(eventTime, defaultEmpty)}
      fullWidth
      name={name}
    >
      <Label>{label ?? copy.eventTimeLabel}</Label>
      <Input className="admin-form__native-input" type="time" />
    </TextField>
  );
}

export function EventAdminDateTimeFields({
  locale,
  eventDate,
  eventTime,
  dateName = "event_date",
  timeName = "event_time",
  isDateRequired = false,
}: EventAdminDateTimeFieldsProps) {
  return (
    <Surface className="grid gap-4 sm:grid-cols-2" variant="transparent">
      <EventAdminDateInput
        eventDate={eventDate}
        isRequired={isDateRequired}
        locale={locale}
        name={dateName}
      />
      <EventAdminTimeInput eventTime={eventTime} locale={locale} name={timeName} />
    </Surface>
  );
}

export function EventAdminDateTimeList({
  locale,
  rows: initialRows,
  isDateRequired = false,
}: EventAdminDateTimeListProps) {
  const copy = getAdminCopy(locale);
  const [rows, setRows] = useState<RowState[]>(() => normalizeInitialRows(initialRows));

  function addRow() {
    if (!ALLOW_MULTI_DATETIME_UI) {
      return;
    }
    setRows((current) => [...current, createRow()]);
  }

  function removeRow(id: string) {
    if (!ALLOW_MULTI_DATETIME_UI) {
      return;
    }
    setRows((current) => {
      if (current.length <= 1) {
        return current;
      }
      return current.filter((row) => row.id !== id);
    });
  }

  const listLabel = ALLOW_MULTI_DATETIME_UI ? copy.eventDateTimesLabel : null;

  return (
    <Surface className="flex flex-col gap-3" variant="transparent">
      {listLabel ? <Label>{listLabel}</Label> : null}
      <input name="datetime_count" type="hidden" value={String(rows.length)} />
      {rows.map((row, index) => (
        <Surface
          className="flex flex-col gap-3 sm:flex-row sm:items-end"
          key={row.id}
          variant="transparent"
        >
          <Surface className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2" variant="transparent">
            <EventAdminDateInput
              eventDate={row.date}
              isRequired={isDateRequired && index === 0}
              locale={locale}
              name={`event_date_${index}`}
            />
            <EventAdminTimeInput
              eventTime={row.time}
              locale={locale}
              name={`event_time_${index}`}
            />
          </Surface>
          {ALLOW_MULTI_DATETIME_UI ? (
            <Button
              className="button button--secondary button--md shrink-0"
              isDisabled={rows.length <= 1}
              onPress={() => removeRow(row.id)}
              type="button"
            >
              {copy.removeDateTimeLabel}
            </Button>
          ) : null}
        </Surface>
      ))}
      {ALLOW_MULTI_DATETIME_UI ? (
        <Button
          className="button button--secondary button--md self-start"
          onPress={addRow}
          type="button"
        >
          {copy.addDateTimeLabel}
        </Button>
      ) : null}
    </Surface>
  );
}
