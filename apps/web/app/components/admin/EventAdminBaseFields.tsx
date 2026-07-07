"use client";

import { Description, Input, InputGroup, Label, Surface, TextField } from "@heroui/react";
import type { SecretCodeMode, TicketType, TimingMode } from "@unveiled/db";
import { useState } from "react";

import { getAdminCopy } from "../../lib/admin-content";
import type { Locale } from "../../lib/locale";
import { AdminFormSelect } from "./AdminFormSelect";
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

      <InputGroup fullWidth>
        <Label>{copy.descriptionLabel}</Label>
        <InputGroup.TextArea defaultValue={defaults?.description} name="description" rows={4} />
      </InputGroup>

      <TextField defaultValue={defaults?.address} fullWidth isRequired name="address">
        <Label>{copy.addressLabel}</Label>
        <Input />
      </TextField>

      <TextField defaultValue={defaults?.neighborhood} fullWidth isRequired name="neighborhood">
        <Label>{copy.neighborhoodLabel}</Label>
        <Input />
      </TextField>

      <Surface className="grid gap-4 sm:grid-cols-2" variant="transparent">
        <TextField defaultValue={defaults?.category} fullWidth isRequired name="category">
          <Label>{copy.categoryLabel}</Label>
          <Input />
        </TextField>
        <TextField defaultValue={defaults?.eventType} fullWidth isRequired name="event_type">
          <Label>{copy.eventTypeLabel}</Label>
          <Input />
        </TextField>
      </Surface>

      <TextField defaultValue={defaults?.tags?.join(", ")} fullWidth name="tags">
        <Label>{copy.tagsLabel}</Label>
        <Input />
        <Description>{copy.tagsHint}</Description>
      </TextField>

      {includeDateTime ? (
        <Surface className="grid gap-4 sm:grid-cols-2" variant="transparent">
          <TextField defaultValue={defaults?.eventDate} fullWidth isRequired name="event_date">
            <Label>{copy.eventDateLabel}</Label>
            <Input type="date" />
          </TextField>
          <TextField defaultValue={defaults?.eventTime} fullWidth name="event_time">
            <Label>{copy.eventTimeLabel}</Label>
            <Input type="time" />
          </TextField>
        </Surface>
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
        <TextField
          defaultValue={defaults?.creditPrice != null ? String(defaults.creditPrice) : "1"}
          fullWidth
          isRequired
          name="credit_price"
        >
          <Label>{copy.creditPriceLabel}</Label>
          <Input inputMode="numeric" type="number" />
        </TextField>
        <TextField
          defaultValue={defaults?.totalCapacity != null ? String(defaults.totalCapacity) : "10"}
          fullWidth
          isRequired
          name="total_capacity"
        >
          <Label>{copy.capacityLabel}</Label>
          <Input inputMode="numeric" type="number" />
        </TextField>
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
        <TextField
          defaultValue={defaults?.languages?.join(", ") ?? undefined}
          fullWidth
          name="languages"
        >
          <Label>{copy.languagesLabel}</Label>
          <Input />
        </TextField>
        <TextField
          defaultValue={defaults?.targetAgeGroups?.join(", ") ?? undefined}
          fullWidth
          name="target_age_groups"
        >
          <Label>{copy.targetAgeGroupsLabel}</Label>
          <Input />
        </TextField>
        <Surface className="grid gap-4 sm:grid-cols-2" variant="transparent">
          <TextField defaultValue={defaults?.lat ?? undefined} fullWidth name="lat">
            <Label>{copy.latLabel}</Label>
            <Input />
          </TextField>
          <TextField defaultValue={defaults?.lng ?? undefined} fullWidth name="lng">
            <Label>{copy.lngLabel}</Label>
            <Input />
          </TextField>
        </Surface>
      </Surface>

      <EventImageUpload
        currentImageUrl={defaults?.currentImageUrl}
        isEdit={isEdit}
        locale={locale}
      />
    </>
  );
}
