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
import { formatEventDateTime, MANUAL_SLOT_ROWS } from "../../lib/admin-route";
import { AdminFormSelect } from "./AdminFormSelect";
import { EventAdminBaseFields } from "./EventAdminBaseFields";
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
        {error ? <Paragraph>{error}</Paragraph> : null}
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
      {error ? <Paragraph>{error}</Paragraph> : null}
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
          {Array.from({ length: MANUAL_SLOT_ROWS }, (_, index) => (
            <Surface className="grid gap-4 sm:grid-cols-2" key={index} variant="transparent">
              <TextField fullWidth name={`slot_date_${index}`}>
                <Label>{copy.eventDateLabel}</Label>
                <Input type="date" />
              </TextField>
              <TextField fullWidth name={`slot_time_${index}`}>
                <Label>{copy.eventTimeLabel}</Label>
                <Input type="time" />
              </TextField>
            </Surface>
          ))}
        </Surface>
      ) : (
        <Surface className="flex flex-col gap-4" variant="transparent">
          <Surface className="grid gap-4 sm:grid-cols-2" variant="transparent">
            <TextField defaultValue={defaults?.eventDate} fullWidth name="builder_start">
              <Label>{copy.builderStartLabel}</Label>
              <Input type="date" />
            </TextField>
            <TextField fullWidth name="builder_end">
              <Label>{copy.builderEndLabel}</Label>
              <Input type="date" />
            </TextField>
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
          <TextField fullWidth name="builder_times">
            <Label>{copy.builderTimesLabel}</Label>
            <Input />
            <Description>{copy.builderTimesHint}</Description>
          </TextField>
          <TextField fullWidth name="builder_excluded">
            <Label>{copy.builderExcludedLabel}</Label>
            <Input />
            <Description>{copy.builderExcludedHint}</Description>
          </TextField>
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
