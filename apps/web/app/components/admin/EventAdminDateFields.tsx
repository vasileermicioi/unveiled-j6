import { Input, Label, Surface } from "@heroui/react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";

type EventAdminDatePickerProps = {
  locale: Locale;
  eventDate?: string;
  name?: string;
  label?: string;
  isRequired?: boolean;
};

type EventAdminTimeFieldProps = {
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

export function EventAdminDatePicker({
  locale,
  eventDate,
  name = "event_date",
  label,
  isRequired = false,
}: EventAdminDatePickerProps) {
  const copy = getAdminCopy(locale);

  return (
    <Surface className="admin-form__native-date-field w-full" variant="transparent">
      <Label>{label ?? copy.eventDateLabel}</Label>
      <Input
        className="admin-form__native-input"
        defaultValue={eventDate ?? ""}
        name={name}
        required={isRequired}
        type="date"
      />
    </Surface>
  );
}

export function EventAdminTimeField({
  locale,
  eventTime,
  name = "event_time",
  label,
  defaultEmpty = false,
}: EventAdminTimeFieldProps) {
  const copy = getAdminCopy(locale);

  return (
    <Surface className="admin-form__native-time-field w-full" variant="transparent">
      <Label>{label ?? copy.eventTimeLabel}</Label>
      <Input
        className="admin-form__native-input"
        defaultValue={getDefaultTimeValue(eventTime, defaultEmpty)}
        name={name}
        type="time"
      />
    </Surface>
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
      <EventAdminDatePicker
        eventDate={eventDate}
        isRequired={isDateRequired}
        locale={locale}
        name={dateName}
      />
      <EventAdminTimeField eventTime={eventTime} locale={locale} name={timeName} />
    </Surface>
  );
}
