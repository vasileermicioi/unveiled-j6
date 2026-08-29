import { Description, Input, Label, Surface, TextField } from "@heroui/react";
import type { CapacityMode, TicketType, TimingMode } from "@unveiled/db";
import { useId, useLayoutEffect, useState } from "react";

import CheckboxMultiSelect from "../../islands/CheckboxMultiSelect";
import { LANGUAGE_MULTI_SELECT_INITIAL_VISIBLE } from "../../islands/LanguageMultiSelect";
import PdfVoucherInventoryIsland from "../../islands/PdfVoucherInventoryIsland";
import PromoCodeInventoryIsland from "../../islands/PromoCodeInventoryIsland";
import {
  getAdminCopy,
  getEventCategoryOptions,
  getEventLanguageOptions,
  getEventSubtitleLanguageOptions,
  getEventTypeOptions,
} from "../../lib/admin-content";
import type { EventFormStep } from "../../lib/admin-event-form";
import { DEFAULT_OCCURRENCE_CAPACITY } from "../../lib/admin-event-form";
import { voucherInventoryDisplayCount } from "../../lib/admin-voucher-inventory";
import {
  draftFieldValue,
  draftFieldValues,
  FORM_DRAFT_APPLIED_EVENT,
  type FormDraftAppliedDetail,
} from "../../lib/form-draft";
import { geocodeBerlinAddress } from "../../lib/geocode-berlin";
import type { Locale } from "../../lib/locale";
import { NativePreferenceOption } from "../onboarding/NativePreferenceOption";
import { AdminFormNumberField } from "./AdminFormNumberField";
import { AdminFormSelect } from "./AdminFormSelect";
import { EventAdminDateTimeList } from "./EventAdminDateFields";
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
  /** When set, inactive steps stay mounted but `hidden`/`inert`. Omit to show all sections. */
  activeStep?: EventFormStep;
};

function stepSurfaceProps(activeStep: EventFormStep | undefined, step: EventFormStep) {
  const inactive = activeStep != null && activeStep !== step;
  return {
    "data-event-form-step": String(step),
    hidden: inactive,
    inert: inactive ? true : undefined,
    className: "flex flex-col gap-6",
    variant: "transparent" as const,
  };
}

function defaultTicketType(defaults?: EventFormDefaults): TicketType {
  return defaults?.ticketType ?? "SECRET_CODE";
}

function defaultTimingMode(defaults?: EventFormDefaults): TimingMode {
  return defaults?.timingMode ?? "TIME_SLOT";
}

function defaultCapacityMode(defaults?: EventFormDefaults): CapacityMode {
  return defaults?.capacityMode ?? "SHARED";
}

function isTicketType(value: string): value is TicketType {
  return value === "SECRET_CODE" || value === "VOUCHER_PROMO" || value === "VOUCHER_PDF";
}

function isCapacityMode(value: string): value is CapacityMode {
  return value === "SHARED" || value === "PER_OCCURRENCE";
}

function structuredAddressFingerprint(
  street: string,
  houseNumber: string,
  zipCode: string,
): string {
  return `${street.trim()}|${houseNumber.trim()}|${zipCode.trim()}`;
}

export function EventAdminBaseFields({
  locale,
  partners,
  defaults,
  includeDateTime = true,
  isEdit = false,
  activeStep,
}: EventAdminBaseFieldsProps) {
  const copy = getAdminCopy(locale);
  const languageOptions = getEventLanguageOptions(locale);
  const subtitleLanguageOptions = getEventSubtitleLanguageOptions(locale);
  const categoryOptions = getEventCategoryOptions(locale);
  const eventTypeOptions = getEventTypeOptions(locale);
  const descriptionDeFieldId = useId();
  const descriptionDeLabelId = useId();
  const descriptionDeHintId = useId();
  const descriptionEnFieldId = useId();
  const descriptionEnLabelId = useId();
  const descriptionEnHintId = useId();
  const [ticketType, setTicketType] = useState<TicketType>(defaultTicketType(defaults));
  const [timingMode, setTimingMode] = useState<TimingMode>(defaultTimingMode(defaults));
  const [capacityMode, setCapacityMode] = useState<CapacityMode>(defaultCapacityMode(defaults));
  const [totalCapacity, setTotalCapacity] = useState(
    String(defaults?.totalCapacity ?? DEFAULT_OCCURRENCE_CAPACITY),
  );
  const [inventoryPreview, setInventoryPreview] = useState({
    incomingCount: 0,
    replaceUnused: false,
  });
  const [selectedPartnerId, setSelectedPartnerId] = useState(defaults?.partnerId ?? "");
  const [street, setStreet] = useState(defaults?.street ?? "");
  const [houseNumber, setHouseNumber] = useState(defaults?.houseNumber ?? "");
  const [addressLine2, setAddressLine2] = useState(defaults?.addressLine2 ?? "");
  const [zipCode, setZipCode] = useState(defaults?.zipCode ?? "");
  const [addressRevision, setAddressRevision] = useState(0);
  const [externalLat, setExternalLat] = useState<string | null>(null);
  const [externalLng, setExternalLng] = useState<string | null>(null);
  const [externalRevision, setExternalRevision] = useState(0);
  const [lastResolvedFingerprint, setLastResolvedFingerprint] = useState(() =>
    defaults?.lat && defaults?.lng
      ? structuredAddressFingerprint(
          defaults.street ?? "",
          defaults.houseNumber ?? "",
          defaults.zipCode ?? "",
        )
      : "",
  );
  const [languageIndependent, setLanguageIndependent] = useState(
    defaults?.languageIndependent ?? false,
  );
  const [hasSubtitles, setHasSubtitles] = useState(defaults?.hasSubtitles ?? false);

  useLayoutEffect(() => {
    function onApplied(event: Event) {
      const fields = (event as CustomEvent<FormDraftAppliedDetail>).detail?.fields;
      if (!fields) {
        return;
      }
      setLanguageIndependent(draftFieldValues(fields, "language_independent").includes("on"));
      setHasSubtitles(draftFieldValues(fields, "has_subtitles").includes("on"));
      const streetValue = draftFieldValue(fields, "street");
      if (streetValue !== undefined) {
        setStreet(streetValue);
      }
      const houseValue = draftFieldValue(fields, "house_number");
      if (houseValue !== undefined) {
        setHouseNumber(houseValue);
      }
      const line2 = draftFieldValue(fields, "address_line2");
      if (line2 !== undefined) {
        setAddressLine2(line2);
      }
      const zip = draftFieldValue(fields, "zip_code");
      if (zip !== undefined) {
        setZipCode(zip);
      }
      const partner = draftFieldValue(fields, "partner_id");
      if (partner !== undefined) {
        setSelectedPartnerId(partner);
      }
      const ticket = draftFieldValue(fields, "ticket_type");
      if (ticket && isTicketType(ticket)) {
        setTicketType(ticket);
      }
      const timing = draftFieldValue(fields, "timing_mode");
      if (timing === "ALL_DAY" || timing === "TIME_SLOT") {
        setTimingMode(timing);
      }
      const capacity = draftFieldValue(fields, "capacity_mode");
      if (capacity && isCapacityMode(capacity)) {
        setCapacityMode(capacity);
      }
      const total = draftFieldValue(fields, "total_capacity");
      if (total !== undefined) {
        setTotalCapacity(total);
      }
      const lat = draftFieldValue(fields, "lat");
      const lng = draftFieldValue(fields, "lng");
      if (lat !== undefined) {
        setExternalLat(lat || null);
      }
      if (lng !== undefined) {
        setExternalLng(lng || null);
      }
    }

    document.addEventListener(FORM_DRAFT_APPLIED_EVENT, onApplied);
    return () => {
      document.removeEventListener(FORM_DRAFT_APPLIED_EVENT, onApplied);
    };
  }, []);

  async function applyAddressGeocode(fields: {
    street: string;
    houseNumber: string;
    zipCode: string;
  }) {
    const geocoded = await geocodeBerlinAddress({
      street: fields.street,
      houseNumber: fields.houseNumber,
      zipCode: fields.zipCode,
      city: "berlin",
    });
    if (!geocoded) {
      setExternalLat(null);
      setExternalLng(null);
      setExternalRevision((current) => current + 1);
      setLastResolvedFingerprint("");
      return;
    }

    setExternalLat(geocoded.lat.toFixed(6));
    setExternalLng(geocoded.lng.toFixed(6));
    setExternalRevision((current) => current + 1);
    setLastResolvedFingerprint(
      structuredAddressFingerprint(fields.street, fields.houseNumber, fields.zipCode),
    );
  }

  async function handlePartnerChange(partnerId: string) {
    setSelectedPartnerId(partnerId);
    if (isEdit) {
      return;
    }

    const partner = partners.find((entry) => entry.id === partnerId);
    if (!partner) {
      return;
    }

    setStreet(partner.street);
    setHouseNumber(partner.houseNumber);
    setAddressLine2(partner.addressLine2 ?? "");
    setZipCode(partner.zipCode);
    setAddressRevision((current) => current + 1);
    await applyAddressGeocode({
      street: partner.street,
      houseNumber: partner.houseNumber,
      zipCode: partner.zipCode,
    });
  }

  async function handleStructuredAddressBlur() {
    const trimmedStreet = street.trim();
    const trimmedHouseNumber = houseNumber.trim();
    const trimmedZipCode = zipCode.trim();
    if (!trimmedStreet || !trimmedHouseNumber || !trimmedZipCode) {
      return;
    }

    const fingerprint = structuredAddressFingerprint(
      trimmedStreet,
      trimmedHouseNumber,
      trimmedZipCode,
    );
    if (fingerprint === lastResolvedFingerprint) {
      return;
    }

    await applyAddressGeocode({
      street: trimmedStreet,
      houseNumber: trimmedHouseNumber,
      zipCode: trimmedZipCode,
    });
  }

  const generalRequired = activeStep == null || activeStep === 1;
  const datesRequired = activeStep == null || activeStep === 2;
  const selectedPartner = partners.find((partner) => partner.id === selectedPartnerId);
  const inventoryTotal =
    ticketType === "SECRET_CODE"
      ? null
      : (voucherInventoryDisplayCount(
          ticketType,
          inventoryPreview.incomingCount,
          inventoryPreview.replaceUnused,
          defaults?.inventoryCounts,
        ) ?? 0);

  return (
    <>
      <Surface {...stepSurfaceProps(activeStep, 1)}>
        <AdminFormSelect
          defaultSelectedKey={defaults?.partnerId}
          isRequired={generalRequired}
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

        <TextField
          defaultValue={defaults?.titleDe}
          fullWidth
          isRequired={generalRequired}
          name="title_de"
        >
          <Label>{copy.titleLabelDe}</Label>
          <Input />
        </TextField>

        {/* Description: MDXEditor exception; SSR POST still submits native name="description_de". */}
        <Surface className="flex flex-col gap-2" variant="transparent">
          <Label id={descriptionDeLabelId}>{copy.descriptionLabelDe}</Label>
          <EventDescriptionEditor
            aria-describedby={descriptionDeHintId}
            aria-labelledby={descriptionDeLabelId}
            id={descriptionDeFieldId}
            initialMarkdown={defaults?.descriptionDe ?? ""}
            name="description_de"
            required={generalRequired}
          />
          <Description id={descriptionDeHintId}>{copy.descriptionMarkdownHint}</Description>
        </Surface>

        <TextField
          defaultValue={defaults?.titleEn}
          fullWidth
          isRequired={generalRequired}
          name="title_en"
        >
          <Label>{copy.titleLabelEn}</Label>
          <Input />
        </TextField>

        <Surface className="flex flex-col gap-2" variant="transparent">
          <Label id={descriptionEnLabelId}>{copy.descriptionLabelEn}</Label>
          <EventDescriptionEditor
            aria-describedby={descriptionEnHintId}
            aria-labelledby={descriptionEnLabelId}
            id={descriptionEnFieldId}
            initialMarkdown={defaults?.descriptionEn ?? ""}
            name="description_en"
            required={generalRequired}
          />
          <Description id={descriptionEnHintId}>{copy.descriptionMarkdownHint}</Description>
        </Surface>

        <Surface className="grid gap-4 lg:grid-cols-2 lg:items-start" variant="transparent">
          <Surface className="flex flex-col gap-4" variant="transparent">
            <Surface className="grid gap-4 sm:grid-cols-2" variant="transparent">
              <Surface className="flex w-full flex-col gap-1" variant="transparent">
                <Label htmlFor="event-country-display">{copy.countryLabel}</Label>
                <input
                  className="admin-native-text"
                  defaultValue={copy.countryDisplay}
                  id="event-country-display"
                  readOnly
                  tabIndex={-1}
                  type="text"
                />
              </Surface>
              <Surface className="flex w-full flex-col gap-1" variant="transparent">
                <Label htmlFor="event-city-display">{copy.cityLabel}</Label>
                <input
                  className="admin-native-text"
                  defaultValue={copy.cityDisplay}
                  id="event-city-display"
                  readOnly
                  tabIndex={-1}
                  type="text"
                />
              </Surface>
            </Surface>

            <Surface className="flex w-full flex-col gap-1" variant="transparent">
              <Label htmlFor="event-zip-code">{copy.zipCodeLabel}</Label>
              <input
                className="admin-native-text"
                id="event-zip-code"
                inputMode="numeric"
                key={`zip-code-${addressRevision}`}
                maxLength={5}
                name="zip_code"
                onBlur={() => {
                  void handleStructuredAddressBlur();
                }}
                onChange={(event) => setZipCode(event.currentTarget.value)}
                required={generalRequired}
                type="text"
                value={zipCode}
              />
              <Description>{copy.zipCodeHint}</Description>
            </Surface>

            <TextField
              key={`street-${addressRevision}`}
              fullWidth
              isRequired={generalRequired}
              name="street"
              value={street}
            >
              <Label>{copy.streetLabel}</Label>
              <Input
                onBlur={() => {
                  void handleStructuredAddressBlur();
                }}
                onChange={(event) => setStreet(event.currentTarget.value)}
              />
            </TextField>

            <TextField
              key={`house-number-${addressRevision}`}
              fullWidth
              isRequired={generalRequired}
              name="house_number"
              value={houseNumber}
            >
              <Label>{copy.houseNumberLabel}</Label>
              <Input
                onBlur={() => {
                  void handleStructuredAddressBlur();
                }}
                onChange={(event) => setHouseNumber(event.currentTarget.value)}
              />
            </TextField>

            <TextField
              key={`address-line2-${addressRevision}`}
              fullWidth
              name="address_line2"
              value={addressLine2}
            >
              <Label>{copy.addressLine2Label}</Label>
              <Input onChange={(event) => setAddressLine2(event.currentTarget.value)} />
            </TextField>

            <input name="country" type="hidden" value={defaults?.country ?? "DE"} />
            <input name="city" type="hidden" value={defaults?.city ?? "berlin"} />
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
            isRequired={generalRequired}
            label={copy.categoryLabel}
            name="category"
            options={categoryOptions}
            placeholder={copy.selectPlaceholder}
          />
          <AdminFormSelect
            defaultSelectedKey={defaults?.eventType}
            isRequired={generalRequired}
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

        <Surface className="flex flex-col gap-4" variant="transparent">
          <Surface className="flex w-full flex-col gap-2" variant="transparent">
            <Label>{copy.languageIndependentLabel}</Label>
            <Surface className="onboarding-form__options" variant="transparent">
              <NativePreferenceOption
                defaultChecked={languageIndependent}
                inputLabel={copy.languageIndependentLabel}
                label={copy.optionYes}
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
                initialVisibleCount={LANGUAGE_MULTI_SELECT_INITIAL_VISIBLE}
                name="languages"
                options={languageOptions.map((option) => ({
                  value: option.id,
                  label: option.label,
                }))}
                searchHint={copy.languagesSearchHint}
                selected={defaults?.languages ?? []}
              />
            </Surface>
          )}
          <Surface className="flex w-full flex-col gap-2" variant="transparent">
            <Label>{copy.hasSubtitlesLabel}</Label>
            <Surface className="onboarding-form__options" variant="transparent">
              <NativePreferenceOption
                defaultChecked={hasSubtitles}
                inputLabel={copy.hasSubtitlesLabel}
                label={copy.optionYes}
                name="has_subtitles"
                onChange={(event) => setHasSubtitles(event.target.checked)}
                type="checkbox"
                value="on"
              />
            </Surface>
            <Description>{copy.hasSubtitlesHint}</Description>
          </Surface>
          {hasSubtitles ? (
            <Surface className="flex w-full flex-col gap-1" variant="transparent">
              <Label>{copy.subtitleLanguageLabel}</Label>
              <CheckboxMultiSelect
                enableSearch
                filterPlaceholder={copy.subtitleLanguagesSearchPlaceholder}
                initialVisibleCount={LANGUAGE_MULTI_SELECT_INITIAL_VISIBLE}
                name="subtitle_languages"
                options={subtitleLanguageOptions.map((option) => ({
                  value: option.id,
                  label: option.label,
                }))}
                searchHint={copy.subtitleLanguagesSearchHint}
                selected={defaults?.subtitleLanguages ?? []}
              />
            </Surface>
          ) : null}
        </Surface>
      </Surface>

      <Surface {...stepSurfaceProps(activeStep, 2)}>
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
          isRequired={datesRequired}
          label={copy.capacityLabel}
          minValue={1}
          name="total_capacity"
          onChange={setTotalCapacity}
          value={totalCapacity}
        />

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

        {ticketType === "SECRET_CODE" ? (
          <TextField
            defaultValue={defaults?.secretCode ?? undefined}
            fullWidth
            isRequired={datesRequired}
            name="secret_code"
          >
            <Label>{copy.secretCodeLabel}</Label>
            <Input />
          </TextField>
        ) : null}

        {ticketType === "VOUCHER_PROMO" ? (
          <>
            <TextField
              defaultValue={defaults?.eventWebsiteUrl ?? undefined}
              fullWidth
              isRequired={datesRequired}
              name="event_website_url"
            >
              <Label>{copy.eventWebsiteUrlLabel}</Label>
              <Input type="url" />
            </TextField>
            <PromoCodeInventoryIsland
              initialCodes={defaults?.promoCodes}
              inventoryCounts={defaults?.inventoryCounts?.promo ?? null}
              isEdit={isEdit}
              locale={locale}
              onInventoryPreviewChange={setInventoryPreview}
            />
          </>
        ) : null}

        {ticketType === "VOUCHER_PDF" ? (
          <PdfVoucherInventoryIsland
            eventId={defaults?.eventId ?? null}
            initialStaged={defaults?.voucherPdfs}
            inventoryCounts={defaults?.inventoryCounts?.pdf ?? null}
            isEdit={isEdit}
            locale={locale}
            onInventoryPreviewChange={setInventoryPreview}
            uploadPath={`/${locale}/admin/uploads/voucher-pdf`}
          />
        ) : null}

        {includeDateTime ? (
          <EventAdminDateTimeList
            applyPartnerHours={!isEdit}
            capacityMode={capacityMode}
            defaultOccurrenceCapacity={totalCapacity}
            hasOpeningHours={selectedPartner?.hasOpeningHours ?? false}
            inventoryTotal={inventoryTotal}
            isDateRequired={datesRequired}
            locale={locale}
            openingHours={selectedPartner?.openingHours ?? null}
            partnerId={selectedPartnerId}
            rangeEnd={defaults?.rangeEnd}
            rangeSlots={defaults?.rangeSlots}
            rangeStart={defaults?.rangeStart}
            rows={defaults?.dateTimeRows}
            timingMode={timingMode}
          />
        ) : null}
      </Surface>

      <Surface {...stepSurfaceProps(activeStep, 3)}>
        <EventImageUpload
          currentCredit={defaults?.currentImageCredit}
          currentImageId={defaults?.currentImageId}
          currentImageUrl={defaults?.currentImageUrl}
          imagePublicBaseUrl={defaults?.imagePublicBaseUrl}
          isEdit={isEdit}
          locale={locale}
        />
      </Surface>
    </>
  );
}
