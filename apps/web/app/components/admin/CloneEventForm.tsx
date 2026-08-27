import { Button, Description, Form, Heading, Link, Paragraph, Surface } from "@heroui/react";
import type { CapacityMode, TicketType, TimingMode } from "@unveiled/db";
import { useLayoutEffect, useState } from "react";

import PdfVoucherInventoryIsland from "../../islands/PdfVoucherInventoryIsland";
import PromoCodeInventoryIsland from "../../islands/PromoCodeInventoryIsland";
import { getAdminCopy } from "../../lib/admin-content";
import { DEFAULT_OCCURRENCE_CAPACITY } from "../../lib/admin-event-form";
import { voucherInventoryDisplayCount } from "../../lib/admin-voucher-inventory";
import {
  draftFieldValue,
  FORM_DRAFT_APPLIED_EVENT,
  type FormDraftAppliedDetail,
} from "../../lib/form-draft";
import type { Locale } from "../../lib/locale";

import { AdminFormError } from "./AdminFormError";
import { AdminFormNumberField } from "./AdminFormNumberField";
import { AdminFormSelect } from "./AdminFormSelect";
import { EventAdminDateTimeList } from "./EventAdminDateFields";
import type { EventDateTimeRow } from "./event-admin-types";
import { FormDraftPersistence } from "./FormDraftPersistence";

/** Island props must be JSON-serializable — no Date objects. */
export type CloneEventFormSource = {
  id: string;
  title: string;
  partnerName: string;
  ticketType: TicketType;
  timingMode: TimingMode;
  capacityMode: CapacityMode;
  totalCapacity: number;
  /** Preformatted Europe/Berlin date/time label for the source summary. */
  dateTimeLabel: string;
  imageUrl: string | null;
  dateTimeRows: EventDateTimeRow[];
};

type CloneEventFormProps = {
  locale: Locale;
  action: string;
  cancelHref: string;
  source: CloneEventFormSource;
  defaults?: {
    dateTimeRows?: EventDateTimeRow[];
    rangeStart?: string;
    rangeEnd?: string;
    rangeSlots?: { time: string; credits: string }[];
    capacityMode?: CapacityMode;
    totalCapacity?: number;
  };
  error?: string | null;
};

function ticketTypeLabel(locale: Locale, ticketType: TicketType): string {
  const copy = getAdminCopy(locale);
  if (ticketType === "VOUCHER_PROMO") {
    return copy.ticketTypeVoucher;
  }
  if (ticketType === "VOUCHER_PDF") {
    return copy.ticketTypeVoucherPdf;
  }
  return copy.ticketTypeSecretCode;
}

function isCapacityMode(value: string): value is CapacityMode {
  return value === "SHARED" || value === "PER_OCCURRENCE";
}

export function CloneEventForm({
  locale,
  action,
  cancelHref,
  source,
  defaults,
  error = null,
}: CloneEventFormProps) {
  const copy = getAdminCopy(locale);
  const draftFormId = `admin-event-clone:${source.id}`;
  const [timingMode, setTimingMode] = useState<TimingMode>(source.timingMode);
  const [capacityMode, setCapacityMode] = useState<CapacityMode>(
    defaults?.capacityMode ?? source.capacityMode,
  );
  const [totalCapacity, setTotalCapacity] = useState(
    String(defaults?.totalCapacity ?? source.totalCapacity ?? DEFAULT_OCCURRENCE_CAPACITY),
  );
  const [inventoryPreview, setInventoryPreview] = useState({
    incomingCount: 0,
    replaceUnused: false,
  });
  const needsInventory =
    source.ticketType === "VOUCHER_PROMO" || source.ticketType === "VOUCHER_PDF";
  const inventoryTotal = needsInventory
    ? (voucherInventoryDisplayCount(
        source.ticketType,
        inventoryPreview.incomingCount,
        inventoryPreview.replaceUnused,
        null,
      ) ?? 0)
    : null;

  useLayoutEffect(() => {
    function onApplied(event: Event) {
      const detail = (event as CustomEvent<FormDraftAppliedDetail>).detail;
      if (!detail?.fields) {
        return;
      }
      const timing = draftFieldValue(detail.fields, "timing_mode");
      if (timing === "ALL_DAY" || timing === "TIME_SLOT") {
        setTimingMode(timing);
      }
      const capacity = draftFieldValue(detail.fields, "capacity_mode");
      if (capacity === "SHARED" || capacity === "PER_OCCURRENCE") {
        setCapacityMode(capacity);
      }
      const total = draftFieldValue(detail.fields, "total_capacity");
      if (total !== undefined) {
        setTotalCapacity(total);
      }
    }

    document.addEventListener(FORM_DRAFT_APPLIED_EVENT, onApplied);
    return () => {
      document.removeEventListener(FORM_DRAFT_APPLIED_EVENT, onApplied);
    };
  }, []);

  return (
    <Form
      action={action}
      className="admin-form flex flex-col gap-6"
      data-form-draft-id={draftFormId}
      encType="multipart/form-data"
      method="post"
    >
      <FormDraftPersistence formId={draftFormId} locale={locale} seedIfEmpty={Boolean(error)} />
      {error ? <AdminFormError message={error} /> : null}

      <input name="ticket_type" type="hidden" value={source.ticketType} />

      <Surface className="flex flex-col gap-3" variant="transparent">
        <Heading level={2}>{copy.cloneSourceLabel}</Heading>
        <Surface className="flex flex-col gap-3 sm:flex-row sm:items-start" variant="transparent">
          {source.imageUrl ? (
            <Surface className="admin-table__logo shrink-0" variant="transparent">
              <img alt={copy.cloneSourceImageAlt} src={source.imageUrl} />
            </Surface>
          ) : null}
          <Surface className="flex flex-col gap-1" variant="transparent">
            <Paragraph>{source.title}</Paragraph>
            <Paragraph color="muted" size="sm">
              {source.partnerName}
            </Paragraph>
            <Paragraph color="muted" size="sm">
              {ticketTypeLabel(locale, source.ticketType)} · {source.dateTimeLabel}
            </Paragraph>
          </Surface>
        </Surface>
      </Surface>

      <AdminFormSelect
        defaultSelectedKey={timingMode}
        label={copy.timingModeLabel}
        name="timing_mode"
        onSelectionChange={(value) => {
          if (value === "ALL_DAY" || value === "TIME_SLOT") {
            setTimingMode(value);
          }
        }}
        options={[
          { id: "TIME_SLOT", label: copy.timingModeTimeSlot },
          { id: "ALL_DAY", label: copy.timingModeAllDay },
        ]}
        placeholder={copy.selectPlaceholder}
      />

      <AdminFormSelect
        defaultSelectedKey={capacityMode}
        label={copy.capacityAllocationLabel}
        name="capacity_mode"
        onSelectionChange={(value) => {
          if (typeof value === "string" && isCapacityMode(value)) {
            setCapacityMode(value);
          }
        }}
        options={[
          { id: "SHARED", label: copy.capacityAllocationShared },
          { id: "PER_OCCURRENCE", label: copy.capacityAllocationPerDate },
        ]}
        placeholder={copy.selectPlaceholder}
      />
      <Description>
        {capacityMode === "PER_OCCURRENCE"
          ? copy.capacityAllocationPerDateHint
          : copy.capacityAllocationSharedHint}
      </Description>
      <AdminFormNumberField
        isRequired
        label={copy.capacityLabel}
        minValue={1}
        name="total_capacity"
        onChange={setTotalCapacity}
        value={totalCapacity}
      />

      {needsInventory ? (
        <Surface className="flex flex-col gap-3" variant="transparent">
          <Description>{copy.cloneInventoryHint}</Description>
          {source.ticketType === "VOUCHER_PROMO" ? (
            <PromoCodeInventoryIsland
              isEdit={false}
              locale={locale}
              onInventoryPreviewChange={setInventoryPreview}
            />
          ) : (
            <PdfVoucherInventoryIsland
              eventId={null}
              isEdit={false}
              locale={locale}
              onInventoryPreviewChange={setInventoryPreview}
              uploadPath={`/${locale}/admin/uploads/voucher-pdf`}
            />
          )}
        </Surface>
      ) : null}

      <Surface className="flex flex-col gap-2" variant="transparent">
        <EventAdminDateTimeList
          applyPartnerHours={false}
          capacityMode={capacityMode}
          defaultOccurrenceCapacity={totalCapacity}
          inventoryTotal={inventoryTotal}
          isDateRequired
          locale={locale}
          openingHours={null}
          rangeEnd={defaults?.rangeEnd}
          rangeSlots={defaults?.rangeSlots}
          rangeStart={defaults?.rangeStart}
          rows={defaults?.dateTimeRows ?? source.dateTimeRows}
          timingMode={timingMode}
        />
        <Description>{copy.cloneDateTimeHint}</Description>
      </Surface>

      <Surface className="flex flex-col gap-3 sm:flex-row sm:items-center" variant="transparent">
        <Button className="button button--primary button--md sm:min-w-40" type="submit">
          {copy.cloneSubmit}
        </Button>
        <Link className="button button--secondary button--md sm:min-w-40" href={cancelHref}>
          {copy.cancel}
        </Link>
      </Surface>
    </Form>
  );
}
