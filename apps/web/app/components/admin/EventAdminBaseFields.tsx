"use client";

import { Description, Input, Label, Surface, TextArea, TextField } from "@heroui/react";
import type { SecretCodeMode, TicketType, TimingMode } from "@unveiled/db";
import { useState } from "react";

import {
  getAdminCopy,
  getEventAgeGroupOptions,
  getEventCategoryOptions,
  getEventLanguageOptions,
  getEventTypeOptions,
} from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";
import { AdminFormNumberField } from "./AdminFormNumberField";
import { AdminFormSelect } from "./AdminFormSelect";
import { EventAdminDateTimeFields } from "./EventAdminDateFields";
import { EventGeoPicker } from "./EventGeoPicker";
import { EventImageUpload } from "./EventImageUpload";
import type { EventFormDefaults, PartnerOption } from "./event-admin-types";

type EventAdminBaseFieldsProps = {
  locale: Locale;
  partners: PartnerOption[];
  defaults?: EventFormDefaults;
  includeDateTime?: boolean;
  isEdit?: boolean;
};

function defaultTicketType(defaults?: EventFormDefaults): TicketType {
  return defaults?.ticketType ?? "SECRET_CODE";
}

function defaultSecretCodeMode(defaults?: EventFormDefaults): SecretCodeMode {
  return defaults?.secretCodeMode ?? "MANUAL";
}

function defaultTimingMode(defaults?: EventFormDefaults): TimingMode {
  return defaults?.timingMode ?? "TIME_SLOT";
}

export function EventAdminBaseFields({
  locale,
  partners,
  defaults,
  includeDateTime = true,
  isEdit = false,
}: EventAdminBaseFieldsProps) {
  const copy = getAdminCopy(locale);
  const languageOptions = getEventLanguageOptions(locale);
  const ageGroupOptions = getEventAgeGroupOptions(locale);
  const categoryOptions = getEventCategoryOptions(locale);
  const eventTypeOptions = getEventTypeOptions(locale);
  const [ticketType, setTicketType] = useState<TicketType>(defaultTicketType(defaults));
  const [secretCodeMode, setSecretCodeMode] = useState<SecretCodeMode>(
    defaultSecretCodeMode(defaults),
  );

  return (
    <>
      <AdminFormSelect
        defaultSelectedKey={defaults?.partnerId}
        isRequired
        label={copy.partnerLabel}
        name="partner_id"
        options={partners.map((partner) => ({ id: partner.id, label: partner.name }))}
        placeholder={copy.selectPlaceholder}
      />

      <TextField defaultValue={defaults?.title} fullWidth isRequired name="title">
        <Label>{copy.titleLabel}</Label>
        <Input />
      </TextField>

      <TextField defaultValue={defaults?.description} fullWidth isRequired name="description">
        <Label>{copy.descriptionLabel}</Label>
        <TextArea rows={4} />
      </TextField>

      <TextField defaultValue={defaults?.address} fullWidth isRequired name="address">
        <Label>{copy.addressLabel}</Label>
        <Input />
      </TextField>

      <TextField defaultValue={defaults?.neighborhood} fullWidth isRequired name="neighborhood">
        <Label>{copy.neighborhoodLabel}</Label>
        <Input />
      </TextField>

      <Surface className="grid gap-4 sm:grid-cols-2" variant="transparent">
        <AdminFormSelect
          defaultSelectedKey={defaults?.category}
          isRequired
          label={copy.categoryLabel}
          name="category"
          options={categoryOptions}
          placeholder={copy.selectPlaceholder}
        />
        <AdminFormSelect
          defaultSelectedKey={defaults?.eventType}
          isRequired
          label={copy.eventTypeLabel}
          name="event_type"
          options={eventTypeOptions}
          placeholder={copy.selectPlaceholder}
        />
      </Surface>

      <TextField defaultValue={defaults?.tags?.join(", ")} fullWidth name="tags">
        <Label>{copy.tagsLabel}</Label>
        <Input />
        <Description>{copy.tagsHint}</Description>
      </TextField>

      {includeDateTime ? (
        <EventAdminDateTimeFields
          eventDate={defaults?.eventDate}
          eventTime={defaults?.eventTime}
          isDateRequired
          locale={locale}
        />
      ) : null}

      <AdminFormSelect
        defaultSelectedKey={defaultTimingMode(defaults)}
        label={copy.timingModeLabel}
        name="timing_mode"
        options={[
          { id: "TIME_SLOT", label: copy.timingModeTimeSlot },
          { id: "ALL_DAY", label: copy.timingModeAllDay },
        ]}
        placeholder={copy.selectPlaceholder}
      />

      <Surface className="grid gap-4 sm:grid-cols-2" variant="transparent">
        <AdminFormNumberField
          defaultValue={defaults?.creditPrice ?? 1}
          isRequired
          label={copy.creditPriceLabel}
          minValue={1}
          name="credit_price"
        />
        <AdminFormNumberField
          defaultValue={defaults?.totalCapacity ?? 10}
          isRequired
          label={copy.capacityLabel}
          minValue={1}
          name="total_capacity"
        />
      </Surface>

      <AdminFormSelect
        defaultSelectedKey={ticketType}
        label={copy.ticketTypeLabel}
        name="ticket_type"
        onSelectionChange={(value) => {
          if (typeof value === "string" && (value === "SECRET_CODE" || value === "VOUCHER")) {
            setTicketType(value);
          }
        }}
        options={[
          { id: "SECRET_CODE", label: copy.ticketTypeSecretCode },
          { id: "VOUCHER", label: copy.ticketTypeVoucher },
        ]}
        placeholder={copy.selectPlaceholder}
      />

      {ticketType === "SECRET_CODE" ? (
        <Surface className="flex flex-col gap-4" variant="transparent">
          <AdminFormSelect
            defaultSelectedKey={secretCodeMode}
            label={copy.secretCodeModeLabel}
            name="secret_code_mode"
            onSelectionChange={(value) => {
              if (
                typeof value === "string" &&
                (value === "MANUAL" ||
                  value === "SHARED_GENERATED" ||
                  value === "UNIQUE_PER_BOOKING")
              ) {
                setSecretCodeMode(value);
              }
            }}
            options={[
              { id: "MANUAL", label: copy.secretCodeModeManual },
              { id: "SHARED_GENERATED", label: copy.secretCodeModeShared },
              { id: "UNIQUE_PER_BOOKING", label: copy.secretCodeModeUnique },
            ]}
            placeholder={copy.selectPlaceholder}
          />
          {secretCodeMode === "MANUAL" ? (
            <TextField
              defaultValue={defaults?.secretCode ?? undefined}
              fullWidth
              name="secret_code"
            >
              <Label>{copy.secretCodeLabel}</Label>
              <Input />
            </TextField>
          ) : null}
        </Surface>
      ) : (
        <Surface className="flex flex-col gap-4" variant="transparent">
          <TextField defaultValue={defaults?.promoCode ?? undefined} fullWidth name="promo_code">
            <Label>{copy.promoCodeLabel}</Label>
            <Input />
          </TextField>
          <TextField
            defaultValue={defaults?.eventWebsiteUrl ?? undefined}
            fullWidth
            name="event_website_url"
          >
            <Label>{copy.eventWebsiteUrlLabel}</Label>
            <Input type="url" />
          </TextField>
        </Surface>
      )}

      <Surface className="flex flex-col gap-4" variant="transparent">
        <AdminFormSelect
          defaultSelectedKey={defaults?.barrierFree === true ? "on" : "off"}
          label={copy.barrierFreeLabel}
          name="barrier_free"
          options={[
            { id: "off", label: copy.optionNo },
            { id: "on", label: copy.optionYes },
          ]}
          placeholder={copy.selectPlaceholder}
        />
        <AdminFormSelect
          defaultSelectedKeys={defaults?.languages ?? []}
          label={copy.languagesLabel}
          name="languages"
          options={languageOptions}
          placeholder={copy.selectPlaceholder}
          selectionMode="multiple"
        />
        <AdminFormSelect
          defaultSelectedKeys={defaults?.targetAgeGroups ?? []}
          label={copy.targetAgeGroupsLabel}
          name="target_age_groups"
          options={ageGroupOptions}
          placeholder={copy.selectPlaceholder}
          selectionMode="multiple"
        />
        <EventGeoPicker
          lat={defaults?.lat}
          lng={defaults?.lng}
          locale={locale}
          mapZoom={defaults?.mapZoom}
        />
      </Surface>

      <EventImageUpload
        currentImageUrl={defaults?.currentImageUrl}
        isEdit={isEdit}
        locale={locale}
      />
    </>
  );
}
