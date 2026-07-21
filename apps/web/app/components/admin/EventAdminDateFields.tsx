import { Input, Label, Surface, TextField } from "@heroui/react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

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

const DEFAULT_EVENT_TIME = "19:30";

function getDefaultTimeValue(eventTime: string | undefined, defaultEmpty: boolean): string {
  if (eventTime) {
    return eventTime;
  }

  return defaultEmpty ? "" : DEFAULT_EVENT_TIME;
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
