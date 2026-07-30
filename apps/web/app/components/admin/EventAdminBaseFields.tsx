"use client";

import { Description, Input, Label, Surface, TextField } from "@heroui/react";
import type { TicketType, TimingMode } from "@unveiled/db";
import { useId, useState } from "react";

import CheckboxMultiSelect from "../../islands/CheckboxMultiSelect";
import PdfVoucherInventoryIsland from "../../islands/PdfVoucherInventoryIsland";
import PromoCodeInventoryIsland from "../../islands/PromoCodeInventoryIsland";
import {
  getAdminCopy,
  getEventAgeGroupOptions,
  getEventCategoryOptions,
  getEventLanguageOptions,
  getEventNeighborhoodOptions,
  getEventTypeOptions,
} from "../../lib/admin-content";
import { geocodeBerlinAddress } from "../../lib/geocode-berlin";
import type { Locale } from "../../lib/locale";
import { NativePreferenceOption } from "../onboarding/NativePreferenceOption";
import { AdminFormNumberField } from "./AdminFormNumberField";
import { AdminFormSelect } from "./AdminFormSelect";
import { EventAdminDateTimeFields } from "./EventAdminDateFields";
import { EventDescriptionEditor } from "./EventDescriptionEditor";
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

function defaultTimingMode(defaults?: EventFormDefaults): TimingMode {
  return defaults?.timingMode ?? "TIME_SLOT";
}

function isTicketType(value: string): value is TicketType {
  return value === "SECRET_CODE" || value === "VOUCHER_PROMO" || value === "VOUCHER_PDF";
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
  const neighborhoodOptions = getEventNeighborhoodOptions(locale, defaults?.neighborhood);
  const descriptionFieldId = useId();
  const descriptionLabelId = useId();
  const descriptionHintId = useId();
  const [ticketType, setTicketType] = useState<TicketType>(defaultTicketType(defaults));
  const [addressValue, setAddressValue] = useState(defaults?.address ?? "");
  const [addressRevision, setAddressRevision] = useState(0);
  const [externalLat, setExternalLat] = useState<string | null>(null);
  const [externalLng, setExternalLng] = useState<string | null>(null);
  const [externalRevision, setExternalRevision] = useState(0);
  const [lastResolvedAddress, setLastResolvedAddress] = useState(() =>
    defaults?.lat && defaults?.lng ? (defaults.address ?? "") : "",
  );
  const [languageIndependent, setLanguageIndependent] = useState(
    defaults?.languageIndependent ?? false,
  );

  async function applyAddressGeocode(address: string) {
    const trimmed = address.trim();
    if (!trimmed) {
      return;
    }

    const geocoded = await geocodeBerlinAddress(trimmed);
    if (!geocoded) {
      setExternalLat(null);
      setExternalLng(null);
      setExternalRevision((current) => current + 1);
      setLastResolvedAddress("");
      return;
    }

    setExternalLat(geocoded.lat.toFixed(6));
    setExternalLng(geocoded.lng.toFixed(6));
    setExternalRevision((current) => current + 1);
    setLastResolvedAddress(trimmed);
  }

  async function handlePartnerChange(partnerId: string) {
    if (isEdit) {
      return;
    }

    const partner = partners.find((entry) => entry.id === partnerId);
    if (!partner) {
      return;
    }

    setAddressValue(partner.address);
    setAddressRevision((current) => current + 1);
    await applyAddressGeocode(partner.address);
  }

  async function handleAddressBlur(address: string) {
    const trimmed = address.trim();
    if (!trimmed || trimmed === lastResolvedAddress.trim()) {
      return;
    }

    setAddressValue(trimmed);
    await applyAddressGeocode(trimmed);
  }

  return (
    <>
      <AdminFormSelect
        defaultSelectedKey={defaults?.partnerId}
        isRequired
        label={copy.partnerLabel}
        name="partner_id"
        onSelectionChange={(value) => {
          if (typeof value === "string") {
            void handlePartnerChange(value);
          }
        }}
        options={partners.map((partner) => ({ id: partner.id, label: partner.name }))}
        placeholder={copy.selectPlaceholder}
      />

      <TextField defaultValue={defaults?.title} fullWidth isRequired name="title">
        <Label>{copy.titleLabel}</Label>
        <Input />
      </TextField>

      {/* Description: MDXEditor exception; SSR POST still submits native name="description". */}
      <Surface className="flex flex-col gap-2" variant="transparent">
        <Label id={descriptionLabelId}>{copy.descriptionLabel}</Label>
        <EventDescriptionEditor
          aria-describedby={descriptionHintId}
          aria-labelledby={descriptionLabelId}
          id={descriptionFieldId}
          initialMarkdown={defaults?.description ?? ""}
          name="description"
          required
        />
        <Description id={descriptionHintId}>{copy.descriptionMarkdownHint}</Description>
      </Surface>

      <Surface className="grid gap-4 lg:grid-cols-2 lg:items-start" variant="transparent">
        <Surface className="flex flex-col gap-4" variant="transparent">
          <TextField
            key={`address-${addressRevision}`}
            defaultValue={addressValue}
            fullWidth
            isRequired
            name="address"
          >
            <Label>{copy.addressLabel}</Label>
            <Input
              onBlur={(event) => {
                void handleAddressBlur(event.currentTarget.value);
              }}
            />
          </TextField>

          <AdminFormSelect
            defaultSelectedKey={defaults?.neighborhood}
            isRequired
            label={copy.neighborhoodLabel}
            name="neighborhood"
            options={neighborhoodOptions}
            placeholder={copy.selectPlaceholder}
          />
        </Surface>

        <EventGeoPicker
          externalLat={externalLat}
          externalLng={externalLng}
          externalRevision={externalRevision}
          lat={defaults?.lat}
          lng={defaults?.lng}
          locale={locale}
        />
      </Surface>

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
        {ticketType === "SECRET_CODE" ? (
          <AdminFormNumberField
            defaultValue={defaults?.totalCapacity ?? 10}
            isRequired
            label={copy.capacityLabel}
            minValue={1}
            name="total_capacity"
          />
        ) : null}
      </Surface>

      <AdminFormSelect
        defaultSelectedKey={ticketType}
        label={copy.ticketTypeLabel}
        name="ticket_type"
        onSelectionChange={(value) => {
          if (typeof value === "string" && isTicketType(value)) {
            setTicketType(value);
          }
        }}
        options={[
          { id: "SECRET_CODE", label: copy.ticketTypeSecretCode },
          { id: "VOUCHER_PROMO", label: copy.ticketTypeVoucher },
          { id: "VOUCHER_PDF", label: copy.ticketTypeVoucherPdf },
        ]}
        placeholder={copy.selectPlaceholder}
      />

      {ticketType === "VOUCHER_PROMO" || ticketType === "VOUCHER_PDF" ? (
        <Description>{copy.capacityFromInventoryHint}</Description>
      ) : null}

      {ticketType === "SECRET_CODE" ? (
        <TextField defaultValue={defaults?.secretCode ?? undefined} fullWidth name="secret_code">
          <Label>{copy.secretCodeLabel}</Label>
          <Input />
        </TextField>
      ) : null}

      {ticketType === "VOUCHER_PROMO" ? (
        <>
          <TextField
            defaultValue={defaults?.eventWebsiteUrl ?? undefined}
            fullWidth
            name="event_website_url"
          >
            <Label>{copy.eventWebsiteUrlLabel}</Label>
            <Input type="url" />
          </TextField>
          <PromoCodeInventoryIsland
            inventoryCounts={defaults?.inventoryCounts?.promo ?? null}
            isEdit={isEdit}
            locale={locale}
          />
          {!isEdit ? <Description>{copy.voucherInventorySeriesHint}</Description> : null}
        </>
      ) : null}

      {ticketType === "VOUCHER_PDF" ? (
        <>
          <PdfVoucherInventoryIsland
            eventId={defaults?.eventId ?? null}
            inventoryCounts={defaults?.inventoryCounts?.pdf ?? null}
            isEdit={isEdit}
            locale={locale}
            uploadPath={`/${locale}/admin/uploads/voucher-pdf`}
          />
          {!isEdit ? <Description>{copy.voucherInventorySeriesHint}</Description> : null}
        </>
      ) : null}

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
        <Surface className="flex w-full flex-col gap-2" variant="transparent">
          <Surface className="onboarding-form__options" variant="transparent">
            <NativePreferenceOption
              defaultChecked={languageIndependent}
              label={copy.languageIndependentLabel}
              name="language_independent"
              onChange={(event) => setLanguageIndependent(event.target.checked)}
              type="checkbox"
              value="on"
            />
          </Surface>
          <Description>{copy.languageIndependentHint}</Description>
        </Surface>
        {languageIndependent ? null : (
          <Surface className="flex w-full flex-col gap-1" variant="transparent">
            <Label>{copy.languagesLabel}</Label>
            <CheckboxMultiSelect
              enableSearch
              filterPlaceholder={copy.languagesSearchPlaceholder}
              name="languages"
              options={languageOptions.map((option) => ({
                value: option.id,
                label: option.label,
              }))}
              selected={defaults?.languages ?? []}
            />
          </Surface>
        )}
        <Surface className="flex w-full flex-col gap-1" variant="transparent">
          <Label>{copy.targetAgeGroupsLabel}</Label>
          <CheckboxMultiSelect
            name="target_age_groups"
            options={ageGroupOptions.map((option) => ({
              value: option.id,
              label: option.label,
            }))}
            optionsClassName="checkbox-multi-select__options onboarding-form__options onboarding-form__options--stack"
            selected={defaults?.targetAgeGroups ?? []}
          />
        </Surface>
      </Surface>

      <EventImageUpload
        currentImageId={defaults?.currentImageId}
        currentImageUrl={defaults?.currentImageUrl}
        imagePublicBaseUrl={defaults?.imagePublicBaseUrl}
        isEdit={isEdit}
        locale={locale}
      />
    </>
  );
}
