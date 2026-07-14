"use client";

import {
  Button,
  Description,
  Form,
  Heading,
  Input,
  Label,
  Link,
  Paragraph,
  Surface,
  TextField,
} from "@heroui/react";
import { useState } from "react";

import { getAdminCopy } from "../../lib/admin-content";
import {
  BUILDER_TIME_ROWS,
  formatEventDateTime,
  MANUAL_SLOT_ROWS,
} from "../../lib/admin-event-form";
import { AdminFormError } from "./AdminFormError";
import { AdminFormSelect } from "./AdminFormSelect";
import { EventAdminBaseFields } from "./EventAdminBaseFields";
import {
  EventAdminDatePicker,
  EventAdminDateTimeFields,
  EventAdminTimeField,
} from "./EventAdminDateFields";
import type { EventFormDefaults, PartnerOption } from "./event-admin-types";

type EventSeriesFormProps = {
  locale: "de" | "en";
  action: string;
  cancelHref: string;
  partners: PartnerOption[];
  defaults?: EventFormDefaults;
  previewSlots?: Date[];
  error?: string | null;
  slotMode?: "manual" | "builder";
};

const WEEKDAY_VALUES = ["0", "1", "2", "3", "4", "5", "6"];

const MANUAL_SLOTS = Array.from({ length: MANUAL_SLOT_ROWS }, (_, slot) => ({
  id: `manual-slot-${slot}`,
  dateName: `slot_date_${slot}`,
  timeName: `slot_time_${slot}`,
}));

const BUILDER_TIMES = Array.from({ length: BUILDER_TIME_ROWS }, (_, slot) => ({
  id: `builder-time-${slot}`,
  name: `builder_time_${slot}`,
  labelIndex: slot + 1,
  defaultEmpty: slot > 0,
}));

export function EventSeriesForm({
  locale,
  action,
  cancelHref,
  partners,
  defaults,
  previewSlots,
  error = null,
  slotMode: initialSlotMode = "manual",
}: EventSeriesFormProps) {
  const copy = getAdminCopy(locale);
  const [slotMode, setSlotMode] = useState<"manual" | "builder">(initialSlotMode);

  if (previewSlots && previewSlots.length > 0) {
    return (
      <Form
        action={action}
        className="admin-form flex flex-col gap-6"
        encType="multipart/form-data"
        method="post"
      >
        {error ? <AdminFormError message={error} /> : null}
        <Heading level={2}>{copy.seriesPreviewTitle}</Heading>
        <Surface className="flex flex-col gap-2" variant="transparent">
          {previewSlots.map((slot) => (
            <Paragraph key={slot.toISOString()}>{formatEventDateTime(slot, locale)}</Paragraph>
          ))}
        </Surface>
        {previewSlots.map((slot) => (
          <Input
            key={slot.toISOString()}
            name="slot_iso"
            type="hidden"
            value={slot.toISOString()}
          />
        ))}
        <Description>{copy.seriesConfirmImageHint}</Description>
        <EventAdminBaseFields
          defaults={defaults}
          includeDateTime={false}
          locale={locale}
          partners={partners}
        />
        <Input name="slot_mode" type="hidden" value={slotMode} />
        <Surface className="flex flex-col gap-3 sm:flex-row sm:items-center" variant="transparent">
          <Button
            className="button button--primary button--md sm:min-w-40"
            name="action"
            type="submit"
            value="confirm"
          >
            {copy.confirmSeries(previewSlots.length)}
          </Button>
          <Link className="button button--secondary button--md sm:min-w-40" href={cancelHref}>
            {copy.cancel}
          </Link>
        </Surface>
      </Form>
    );
  }

  return (
    <Form
      action={action}
      className="admin-form flex flex-col gap-6"
      encType="multipart/form-data"
      method="post"
    >
      {error ? <AdminFormError message={error} /> : null}
      <EventAdminBaseFields
        defaults={defaults}
        includeDateTime={false}
        locale={locale}
        partners={partners}
      />

      <AdminFormSelect
        defaultSelectedKey={slotMode}
        label={copy.manualSlotsLabel}
        name="slot_mode"
        onSelectionChange={(value) => {
          if (typeof value === "string" && (value === "manual" || value === "builder")) {
            setSlotMode(value);
          }
        }}
        options={[
          { id: "manual", label: copy.slotModeManual },
          { id: "builder", label: copy.slotModeBuilder },
        ]}
        placeholder={copy.selectPlaceholder}
      />

      {slotMode === "manual" ? (
        <Surface className="flex flex-col gap-4" variant="transparent">
          {MANUAL_SLOTS.map((slot) => (
            <EventAdminDateTimeFields
              dateName={slot.dateName}
              key={slot.id}
              locale={locale}
              timeName={slot.timeName}
            />
          ))}
        </Surface>
      ) : (
        <Surface className="flex flex-col gap-4" variant="transparent">
          <Surface className="grid gap-4 sm:grid-cols-2" variant="transparent">
            <EventAdminDatePicker
              eventDate={defaults?.eventDate}
              label={copy.builderStartLabel}
              locale={locale}
              name="builder_start"
            />
            <EventAdminDatePicker label={copy.builderEndLabel} locale={locale} name="builder_end" />
          </Surface>
          <AdminFormSelect
            defaultSelectedKeys={[]}
            label={copy.builderWeekdaysLabel}
            name="builder_weekdays"
            options={WEEKDAY_VALUES.map((value, index) => ({
              id: value,
              label: copy.weekdayLabels[index] ?? value,
            }))}
            placeholder={copy.selectPlaceholder}
            selectionMode="multiple"
          />
          <TextField fullWidth name="builder_excluded">
            <Label>{copy.builderExcludedLabel}</Label>
            <Input />
            <Description>{copy.builderExcludedHint}</Description>
          </TextField>
          <Surface className="flex flex-col gap-4" variant="transparent">
            <Description>{copy.builderTimesHint}</Description>
            {BUILDER_TIMES.map((slot) => (
              <EventAdminTimeField
                defaultEmpty={slot.defaultEmpty}
                key={slot.id}
                label={copy.builderTimeSlotLabel(slot.labelIndex)}
                locale={locale}
                name={slot.name}
              />
            ))}
          </Surface>
        </Surface>
      )}

      <Surface className="flex flex-col gap-3 sm:flex-row sm:items-center" variant="transparent">
        <Button
          className="button button--primary button--md sm:min-w-40"
          name="action"
          type="submit"
          value="preview"
        >
          {copy.previewSeries}
        </Button>
        <Link className="button button--secondary button--md sm:min-w-40" href={cancelHref}>
          {copy.cancel}
        </Link>
      </Surface>
    </Form>
  );
}
