"use client";

import {
  Alert,
  Button,
  Description,
  Input,
  Label,
  Paragraph,
  Surface,
  TextField,
} from "@heroui/react";
import {
  type CapacityMode,
  CatalogValidationError,
  type OpeningHoursWeek,
  type TimingMode,
} from "@unveiled/db";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { getAdminCopy } from "../../lib/admin-content";
import {
  DEFAULT_OCCURRENCE_CAPACITY,
  DEFAULT_RANGE_SLOT_TIME,
  DEFAULT_ROW_CREDITS,
  defaultRangeSlotsFromHours,
  expandOccurrencesFromRange,
  MAX_EVENT_DATE_TIME_ROWS,
  occurrencesToFormRows,
  type RangeBuilderSlotRow,
  showsEventTimeInputs,
  withDefaultOccurrenceCapacity,
} from "../../lib/admin-event-form";
import {
  draftFieldValue,
  FORM_DRAFT_APPLIED_EVENT,
  type FormDraftAppliedDetail,
  type FormDraftFields,
} from "../../lib/form-draft";
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
  applyPartnerHours?: boolean;
  partnerId?: string;
  hasOpeningHours?: boolean;
  openingHours?: OpeningHoursWeek | null;
  timingMode?: TimingMode;
  capacityMode?: CapacityMode;
  defaultOccurrenceCapacity?: string;
  inventoryTotal?: number | null;
  rangeStart?: string;
  rangeEnd?: string;
  rangeSlots?: RangeBuilderSlotRow[];
};

const DEFAULT_EVENT_TIME = DEFAULT_RANGE_SLOT_TIME;

function getDefaultTimeValue(eventTime: string | undefined, defaultEmpty: boolean): string {
  if (eventTime) {
    return eventTime;
  }

  return defaultEmpty ? "" : DEFAULT_EVENT_TIME;
}

type RowState = EventDateTimeRow & { id: string };

function createRow(
  date = "",
  time = DEFAULT_EVENT_TIME,
  credits = DEFAULT_ROW_CREDITS,
  capacity = "",
): RowState {
  return {
    id: crypto.randomUUID(),
    date,
    time,
    credits,
    capacity,
  };
}

function normalizeInitialRows(
  rows: EventDateTimeRow[] | undefined,
  defaultCapacity: string,
): RowState[] {
  if (rows && rows.length > 0) {
    return rows.map((row) =>
      createRow(
        row.date,
        row.time || DEFAULT_EVENT_TIME,
        row.credits ?? DEFAULT_ROW_CREDITS,
        row.capacity || defaultCapacity,
      ),
    );
  }

  return [createRow("", DEFAULT_EVENT_TIME, DEFAULT_ROW_CREDITS, defaultCapacity)];
}

function displayCreditTotal(rows: RowState[]): number {
  return rows.reduce((sum, row) => {
    const parsed = Number.parseInt(row.credits, 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return sum;
    }
    return sum + parsed;
  }, 0);
}

function displayCapacityTotal(
  capacityMode: CapacityMode,
  rows: RowState[],
  sharedTotal: string,
): number {
  if (capacityMode !== "PER_OCCURRENCE") {
    const parsed = Number.parseInt(sharedTotal, 10);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
  }

  return rows.reduce((sum, row) => {
    const parsed = Number.parseInt(row.capacity ?? "", 10);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return sum;
    }
    return sum + parsed;
  }, 0);
}

function rowGridClass(showTimes: boolean, showCapacity: boolean): string {
  const cols = 1 + (showTimes ? 1 : 0) + 1 + (showCapacity ? 1 : 0);
  if (cols >= 4) {
    return "grid min-w-0 flex-1 gap-4 sm:grid-cols-4";
  }
  if (cols === 3) {
    return "grid min-w-0 flex-1 gap-4 sm:grid-cols-3";
  }
  return "grid min-w-0 flex-1 gap-4 sm:grid-cols-2";
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
      <Input className="admin-form__native-input admin-native-date" type="date" />
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
      <Input className="admin-form__native-input admin-native-time" type="time" />
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

function EventAdminCreditInput({
  locale,
  name,
  value,
  onChange,
}: {
  locale: Locale;
  name: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const copy = getAdminCopy(locale);
  const id = `admin-number-${name}`;

  return (
    <Surface className="admin-form__native-field w-full" variant="transparent">
      <Label htmlFor={id}>{copy.creditPriceLabel}</Label>
      <input
        className="admin-native-number"
        id={id}
        min={0}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        step={1}
        type="number"
        value={value}
      />
    </Surface>
  );
}

function EventAdminCapacityInput({
  locale,
  name,
  value,
  onChange,
}: {
  locale: Locale;
  name: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const copy = getAdminCopy(locale);
  const id = `admin-number-${name}`;

  return (
    <Surface className="admin-form__native-field w-full" variant="transparent">
      <Label htmlFor={id}>{copy.capacityLabel}</Label>
      <input
        className="admin-native-number"
        id={id}
        min={0}
        name={name}
        onChange={(event) => onChange(event.target.value)}
        step={1}
        type="number"
        value={value}
      />
    </Surface>
  );
}

type SlotState = RangeBuilderSlotRow & { id: string };
type BuilderErrorKind = "too_many" | "start_after_end" | null;

function createSlot(time = DEFAULT_RANGE_SLOT_TIME, credits = DEFAULT_ROW_CREDITS): SlotState {
  return {
    id: crypto.randomUUID(),
    time,
    credits,
  };
}

function normalizeInitialSlots(slots: RangeBuilderSlotRow[] | undefined): SlotState[] {
  if (slots && slots.length > 0) {
    return slots.map((slot) => createSlot(slot.time || DEFAULT_RANGE_SLOT_TIME, slot.credits));
  }
  return [createSlot()];
}

function parseDraftCount(raw: string | undefined, fallback: number, max: number): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.min(parsed, max);
}

function rowsAndSlotsFromDraft(
  fields: FormDraftFields,
  defaultCapacity: string,
): { rows: RowState[]; startDate: string; endDate: string; slots: SlotState[] } {
  const rowCount = parseDraftCount(
    draftFieldValue(fields, "datetime_count"),
    1,
    MAX_EVENT_DATE_TIME_ROWS,
  );
  const rows = Array.from({ length: rowCount }, (_, index) =>
    createRow(
      draftFieldValue(fields, `event_date_${index}`) ?? "",
      draftFieldValue(fields, `event_time_${index}`) || DEFAULT_EVENT_TIME,
      draftFieldValue(fields, `event_credit_${index}`) || DEFAULT_ROW_CREDITS,
      draftFieldValue(fields, `event_capacity_${index}`) || defaultCapacity,
    ),
  );
  const slotCount = parseDraftCount(
    draftFieldValue(fields, "range_slot_count"),
    1,
    MAX_EVENT_DATE_TIME_ROWS,
  );
  const slots = Array.from({ length: slotCount }, (_, index) =>
    createSlot(
      draftFieldValue(fields, `range_slot_time_${index}`) || DEFAULT_RANGE_SLOT_TIME,
      draftFieldValue(fields, `range_slot_credit_${index}`) || DEFAULT_ROW_CREDITS,
    ),
  );
  return {
    rows:
      rows.length > 0
        ? rows
        : [createRow("", DEFAULT_EVENT_TIME, DEFAULT_ROW_CREDITS, defaultCapacity)],
    startDate: draftFieldValue(fields, "range_start") ?? "",
    endDate: draftFieldValue(fields, "range_end") ?? "",
    slots: slots.length > 0 ? slots : [createSlot()],
  };
}

function slotCreditPrice(credits: string): number {
  const parsed = Number.parseInt(credits, 10);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 1;
  }
  return parsed;
}

function rowsFromOccurrences(
  occurrences: ReturnType<typeof occurrencesToFormRows>,
  defaultCapacity: string,
): RowState[] {
  return withDefaultOccurrenceCapacity(occurrences, defaultCapacity).map((row) =>
    createRow(row.date, row.time, row.credits, row.capacity),
  );
}

export function EventAdminDateTimeList({
  locale,
  rows: initialRows,
  isDateRequired = false,
  applyPartnerHours = false,
  partnerId = "",
  hasOpeningHours = false,
  openingHours = null,
  timingMode = "TIME_SLOT",
  capacityMode = "SHARED",
  defaultOccurrenceCapacity = DEFAULT_OCCURRENCE_CAPACITY,
  inventoryTotal = null,
  rangeStart: initialRangeStart = "",
  rangeEnd: initialRangeEnd = "",
  rangeSlots: initialRangeSlots,
}: EventAdminDateTimeListProps) {
  const copy = getAdminCopy(locale);
  const showTimes = showsEventTimeInputs(timingMode);
  const showCapacity = capacityMode === "PER_OCCURRENCE";
  const [rows, setRows] = useState<RowState[]>(() =>
    normalizeInitialRows(initialRows, defaultOccurrenceCapacity),
  );
  const [startDate, setStartDate] = useState(initialRangeStart);
  const [endDate, setEndDate] = useState(initialRangeEnd);
  const [timeSlots, setTimeSlots] = useState<SlotState[]>(() =>
    normalizeInitialSlots(initialRangeSlots),
  );
  const [builderError, setBuilderError] = useState<BuilderErrorKind>(null);
  const visibleSlots = showTimes ? timeSlots : timeSlots.slice(0, 1);
  const firstSlot = timeSlots[0];
  const prevPartnerId = useRef(partnerId);
  const prevTimingMode = useRef(timingMode);
  const skipNextTimingRebuildRef = useRef(false);
  const defaultCapacityRef = useRef(defaultOccurrenceCapacity);
  defaultCapacityRef.current = defaultOccurrenceCapacity;

  const applyRebuild = useCallback(
    (nextStart: string, nextEnd: string, nextSlots: SlotState[], mode: TimingMode) => {
      if (!nextStart || !nextEnd) {
        return;
      }
      if (nextStart > nextEnd) {
        setBuilderError("start_after_end");
        return;
      }

      const parsedSlots = nextSlots
        .filter((slot) => slot.time.trim().length > 0)
        .map((slot) => ({
          time: slot.time.trim(),
          creditPrice: slotCreditPrice(slot.credits),
        }));
      if (parsedSlots.length === 0) {
        return;
      }

      try {
        const occurrences = expandOccurrencesFromRange({
          startDate: nextStart,
          endDate: nextEnd,
          slots: parsedSlots,
          timingMode: mode,
        });
        if (occurrences.length === 0) {
          return;
        }
        setBuilderError(null);
        setRows(
          rowsFromOccurrences(occurrencesToFormRows(occurrences), defaultCapacityRef.current),
        );
      } catch (error) {
        if (error instanceof CatalogValidationError && error.code === "TOO_MANY_OCCURRENCES") {
          setBuilderError("too_many");
          return;
        }
        throw error;
      }
    },
    [],
  );

  useEffect(() => {
    if (!applyPartnerHours) {
      prevPartnerId.current = partnerId;
      return;
    }
    if (prevPartnerId.current === partnerId) {
      return;
    }
    prevPartnerId.current = partnerId;
    const nextSlots = defaultRangeSlotsFromHours(hasOpeningHours, openingHours).map((slot) =>
      createSlot(slot.time, slot.credits),
    );
    setTimeSlots(nextSlots);
    applyRebuild(startDate, endDate, nextSlots, timingMode);
  }, [
    applyPartnerHours,
    applyRebuild,
    endDate,
    hasOpeningHours,
    openingHours,
    partnerId,
    startDate,
    timingMode,
  ]);

  useEffect(() => {
    if (prevTimingMode.current === timingMode) {
      return;
    }
    prevTimingMode.current = timingMode;
    if (skipNextTimingRebuildRef.current) {
      skipNextTimingRebuildRef.current = false;
      return;
    }
    applyRebuild(startDate, endDate, timeSlots, timingMode);
  }, [applyRebuild, endDate, startDate, timeSlots, timingMode]);

  useLayoutEffect(() => {
    function onApplied(event: Event) {
      const detail = (event as CustomEvent<FormDraftAppliedDetail>).detail;
      if (!detail?.fields) {
        return;
      }
      const restored = rowsAndSlotsFromDraft(detail.fields, defaultCapacityRef.current);
      skipNextTimingRebuildRef.current = true;
      prevTimingMode.current = timingMode;
      setStartDate(restored.startDate);
      setEndDate(restored.endDate);
      setTimeSlots(restored.slots);
      setRows(restored.rows);
    }

    document.addEventListener(FORM_DRAFT_APPLIED_EVENT, onApplied);
    return () => {
      document.removeEventListener(FORM_DRAFT_APPLIED_EVENT, onApplied);
    };
  }, [timingMode]);

  function addRow() {
    setRows((current) => [
      ...current,
      createRow("", DEFAULT_EVENT_TIME, DEFAULT_ROW_CREDITS, defaultCapacityRef.current),
    ]);
  }

  function removeRow(id: string) {
    setRows((current) => {
      if (current.length <= 1) {
        return current;
      }
      return current.filter((row) => row.id !== id);
    });
  }

  function updateCredits(id: string, credits: string) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, credits } : row)));
  }

  function updateCapacity(id: string, capacity: string) {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, capacity } : row)));
  }

  function updateStart(value: string) {
    setStartDate(value);
    applyRebuild(value, endDate, timeSlots, timingMode);
  }

  function updateEnd(value: string) {
    setEndDate(value);
    applyRebuild(startDate, value, timeSlots, timingMode);
  }

  function updateSlots(nextSlots: SlotState[]) {
    setTimeSlots(nextSlots);
    applyRebuild(startDate, endDate, nextSlots, timingMode);
  }

  function addTimeSlot() {
    updateSlots([...timeSlots, createSlot()]);
  }

  function removeTimeSlot(id: string) {
    if (timeSlots.length <= 1) {
      return;
    }
    updateSlots(timeSlots.filter((slot) => slot.id !== id));
  }

  function updateTimeSlot(id: string, patch: Partial<RangeBuilderSlotRow>) {
    updateSlots(timeSlots.map((slot) => (slot.id === id ? { ...slot, ...patch } : slot)));
  }

  const builderErrorMessage =
    builderError === "too_many"
      ? copy.tooManyOccurrences
      : builderError === "start_after_end"
        ? copy.rangeStartAfterEnd
        : null;

  return (
    <Surface className="flex flex-col gap-4" variant="transparent">
      <Surface className="flex flex-col gap-3" variant="transparent">
        <Label className="admin-form__section-label">{copy.rangeBuilderLabel}</Label>
        <Surface className="grid gap-4 sm:grid-cols-2" variant="transparent">
          <Surface className="admin-form__native-date-field w-full" variant="transparent">
            <Label htmlFor="admin-date-range_start">{copy.builderStartLabel}</Label>
            <input
              className="admin-native-date"
              id="admin-date-range_start"
              name="range_start"
              onChange={(event) => updateStart(event.target.value)}
              type="date"
              value={startDate}
            />
          </Surface>
          <Surface className="admin-form__native-date-field w-full" variant="transparent">
            <Label htmlFor="admin-date-range_end">{copy.builderEndLabel}</Label>
            <input
              className="admin-native-date"
              id="admin-date-range_end"
              name="range_end"
              onChange={(event) => updateEnd(event.target.value)}
              type="date"
              value={endDate}
            />
          </Surface>
        </Surface>
        {showTimes ? (
          <Label className="admin-form__section-label">{copy.rangeTimeSlotsLabel}</Label>
        ) : null}
        <input
          name="range_slot_count"
          type="hidden"
          value={String(showTimes ? timeSlots.length : 1)}
        />
        {!showTimes && firstSlot ? (
          <input
            name="range_slot_time_0"
            type="hidden"
            value={firstSlot.time.trim() || DEFAULT_RANGE_SLOT_TIME}
          />
        ) : null}
        {visibleSlots.map((slot, index) => (
          <Surface
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            key={slot.id}
            variant="transparent"
          >
            <Surface
              className={
                showTimes ? "grid min-w-0 flex-1 gap-4 sm:grid-cols-2" : "grid min-w-0 flex-1 gap-4"
              }
              variant="transparent"
            >
              {showTimes ? (
                <Surface className="admin-form__native-time-field w-full" variant="transparent">
                  <Label htmlFor={`admin-time-range_slot_time_${index}`}>
                    {copy.eventTimeLabel}
                  </Label>
                  <input
                    className="admin-native-time"
                    id={`admin-time-range_slot_time_${index}`}
                    name={`range_slot_time_${index}`}
                    onChange={(event) => updateTimeSlot(slot.id, { time: event.target.value })}
                    type="time"
                    value={slot.time}
                  />
                </Surface>
              ) : null}
              <EventAdminCreditInput
                locale={locale}
                name={`range_slot_credit_${index}`}
                onChange={(credits) => updateTimeSlot(slot.id, { credits })}
                value={slot.credits}
              />
            </Surface>
            {showTimes ? (
              <Button
                className="button button--secondary button--md shrink-0"
                isDisabled={timeSlots.length <= 1}
                onPress={() => removeTimeSlot(slot.id)}
                type="button"
              >
                {copy.removeDateTimeLabel}
              </Button>
            ) : null}
          </Surface>
        ))}
        {showTimes ? (
          <Button
            className="button button--secondary button--md self-start"
            onPress={addTimeSlot}
            type="button"
          >
            {copy.addTimeSlotLabel}
          </Button>
        ) : null}
        <Description>{showTimes ? copy.rangeRebuildHint : copy.rangeAllDayHint}</Description>
        {builderErrorMessage ? (
          <Alert status="danger">
            <Alert.Content>
              <Alert.Title>{builderErrorMessage}</Alert.Title>
            </Alert.Content>
          </Alert>
        ) : null}
      </Surface>

      <Surface className="flex flex-col gap-3" variant="transparent">
        <Label className="admin-form__section-label">{copy.eventDateTimesLabel}</Label>
        <input name="datetime_count" type="hidden" value={String(rows.length)} />
        {rows.map((row, index) => (
          <Surface
            className="flex flex-col gap-3 sm:flex-row sm:items-end"
            key={row.id}
            variant="transparent"
          >
            <Surface className={rowGridClass(showTimes, showCapacity)} variant="transparent">
              <EventAdminDateInput
                eventDate={row.date}
                isRequired={isDateRequired && index === 0}
                locale={locale}
                name={`event_date_${index}`}
              />
              {showTimes ? (
                <EventAdminTimeInput
                  eventTime={row.time}
                  locale={locale}
                  name={`event_time_${index}`}
                />
              ) : null}
              <EventAdminCreditInput
                locale={locale}
                name={`event_credit_${index}`}
                onChange={(credits) => updateCredits(row.id, credits)}
                value={row.credits}
              />
              {showCapacity ? (
                <EventAdminCapacityInput
                  locale={locale}
                  name={`event_capacity_${index}`}
                  onChange={(capacity) => updateCapacity(row.id, capacity)}
                  value={row.capacity ?? ""}
                />
              ) : null}
            </Surface>
            <Button
              className="button button--secondary button--md shrink-0"
              isDisabled={rows.length <= 1}
              onPress={() => removeRow(row.id)}
              type="button"
            >
              {copy.removeDateTimeLabel}
            </Button>
          </Surface>
        ))}
        <Button
          className="button button--secondary button--md self-start"
          onPress={addRow}
          type="button"
        >
          {copy.addDateTimeLabel}
        </Button>
        <Paragraph>{copy.dateTimesTotalCreditsLabel(displayCreditTotal(rows))}</Paragraph>
        <Paragraph
          className={
            inventoryTotal !== null &&
            inventoryTotal !== displayCapacityTotal(capacityMode, rows, defaultOccurrenceCapacity)
              ? "admin-form__total--mismatch"
              : undefined
          }
        >
          {copy.dateTimesTotalCapacityLabel(
            displayCapacityTotal(capacityMode, rows, defaultOccurrenceCapacity),
          )}
        </Paragraph>
        {inventoryTotal !== null ? (
          <Paragraph
            className={
              inventoryTotal !== displayCapacityTotal(capacityMode, rows, defaultOccurrenceCapacity)
                ? "admin-form__total--mismatch"
                : undefined
            }
          >
            {copy.dateTimesTotalInventoryLabel(inventoryTotal)}
          </Paragraph>
        ) : null}
      </Surface>
    </Surface>
  );
}
