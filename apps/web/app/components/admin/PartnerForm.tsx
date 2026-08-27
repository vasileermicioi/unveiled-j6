import { Button, Description, Form, Input, Label, Link, Surface, TextField } from "@heroui/react";
import { OPENING_HOURS_DAY_KEYS, type OpeningHoursDayKey } from "@unveiled/db";
import { useLayoutEffect, useState } from "react";

import { getAdminCopy } from "../../lib/admin-content";
import {
  draftFieldValue,
  draftFieldValues,
  FORM_DRAFT_APPLIED_EVENT,
  type FormDraftAppliedDetail,
  type FormDraftFields,
} from "../../lib/form-draft";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";
import {
  emptyOpeningHoursDaysForm,
  type PartnerOpeningHoursDaysForm,
} from "../../lib/partner-opening-hours-form";
import { NativePreferenceOption } from "../onboarding/NativePreferenceOption";

import { AdminFormError } from "./AdminFormError";
import { AdminFormSelect } from "./AdminFormSelect";
import { FormDraftPersistence } from "./FormDraftPersistence";
import { PartnerLogoUpload } from "./PartnerLogoUpload";

export type PartnerFormDefaults = {
  name?: string;
  contactEmail?: string;
  street?: string;
  houseNumber?: string;
  addressLine2?: string | null;
  zipCode?: string;
  country?: string;
  city?: string;
  hasOpeningHours?: boolean;
  openingHoursDays?: PartnerOpeningHoursDaysForm;
  barrierFree?: boolean | null;
  bankDetails?: string | null;
  currentLogoUrl?: string | null;
  currentLogoImageId?: string | null;
  currentLogoCredit?: string | null;
  imagePublicBaseUrl?: string | null;
};

type PartnerFormProps = {
  locale: Locale;
  action: string;
  submitLabel: string;
  cancelHref: string;
  formId: string;
  defaults?: PartnerFormDefaults;
  error?: string | null;
  isEdit?: boolean;
};

function openingHoursDaysFromDraft(
  fields: FormDraftFields,
  fallback: PartnerOpeningHoursDaysForm,
): PartnerOpeningHoursDaysForm {
  const days = emptyOpeningHoursDaysForm(true);
  for (const day of OPENING_HOURS_DAY_KEYS) {
    const open = draftFieldValue(fields, `open_${day}`);
    const close = draftFieldValue(fields, `close_${day}`);
    days[day] = {
      closed: draftFieldValues(fields, `closed_${day}`).includes("on"),
      open: open ?? fallback[day].open,
      close: close ?? fallback[day].close,
    };
  }
  return days;
}

function OpeningHoursDayRow({
  day,
  dayLabel,
  closedLabel,
  openLabel,
  closeLabel,
  defaults,
}: {
  day: OpeningHoursDayKey;
  dayLabel: string;
  closedLabel: string;
  openLabel: string;
  closeLabel: string;
  defaults: { closed: boolean; open: string; close: string };
}) {
  const [closed, setClosed] = useState(defaults.closed);
  const openId = `partner-open-${day}`;
  const closeId = `partner-close-${day}`;

  return (
    <Surface className="flex flex-col gap-3" variant="transparent">
      <Label>{dayLabel}</Label>
      <Surface className="onboarding-form__options" variant="transparent">
        <NativePreferenceOption
          defaultChecked={defaults.closed}
          inputLabel={`${dayLabel} — ${closedLabel}`}
          label={closedLabel}
          name={`closed_${day}`}
          onChange={(event) => setClosed(event.target.checked)}
          type="checkbox"
          value="on"
        />
      </Surface>
      <Surface className="grid gap-3 sm:grid-cols-2" variant="transparent">
        <Surface className="flex w-full flex-col gap-1" variant="transparent">
          <Label htmlFor={openId}>{openLabel}</Label>
          <input
            className="admin-native-text"
            defaultValue={defaults.open}
            disabled={closed}
            id={openId}
            name={`open_${day}`}
            type="time"
          />
        </Surface>
        <Surface className="flex w-full flex-col gap-1" variant="transparent">
          <Label htmlFor={closeId}>{closeLabel}</Label>
          <input
            className="admin-native-text"
            defaultValue={defaults.close}
            disabled={closed}
            id={closeId}
            name={`close_${day}`}
            type="time"
          />
        </Surface>
      </Surface>
    </Surface>
  );
}

export function PartnerForm({
  locale,
  action,
  submitLabel,
  cancelHref,
  formId,
  defaults,
  error = null,
  isEdit = false,
}: PartnerFormProps) {
  const copy = getAdminCopy(locale);
  const [hasOpeningHours, setHasOpeningHours] = useState(Boolean(defaults?.hasOpeningHours));
  const [openingHoursDays, setOpeningHoursDays] = useState(
    () => defaults?.openingHoursDays ?? emptyOpeningHoursDaysForm(true),
  );
  const [hoursEpoch, setHoursEpoch] = useState(0);

  useLayoutEffect(() => {
    function onApplied(event: Event) {
      const detail = (event as CustomEvent<FormDraftAppliedDetail>).detail;
      if (!detail?.fields) {
        return;
      }
      setHasOpeningHours(draftFieldValues(detail.fields, "has_opening_hours").includes("on"));
      setOpeningHoursDays((current) => openingHoursDaysFromDraft(detail.fields, current));
      setHoursEpoch((current) => current + 1);
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
      data-form-draft-id={formId}
      encType="multipart/form-data"
      method="post"
    >
      <FormDraftPersistence formId={formId} locale={locale} seedIfEmpty={Boolean(error)} />
      {error ? <AdminFormError message={error} /> : null}

      <TextField defaultValue={defaults?.name} fullWidth isRequired name="name">
        <Label>{copy.nameLabel}</Label>
        <Input />
      </TextField>

      <TextField defaultValue={defaults?.contactEmail} fullWidth isRequired name="contact_email">
        <Label>{copy.emailLabel}</Label>
        <Input type="email" />
      </TextField>

      <Surface className="grid gap-4 sm:grid-cols-2" variant="transparent">
        <Surface className="flex w-full flex-col gap-1" variant="transparent">
          <Label htmlFor="partner-country-display">{copy.countryLabel}</Label>
          <input
            className="admin-native-text"
            defaultValue={copy.countryDisplay}
            id="partner-country-display"
            readOnly
            tabIndex={-1}
            type="text"
          />
        </Surface>
        <Surface className="flex w-full flex-col gap-1" variant="transparent">
          <Label htmlFor="partner-city-display">{copy.cityLabel}</Label>
          <input
            className="admin-native-text"
            defaultValue={copy.cityDisplay}
            id="partner-city-display"
            readOnly
            tabIndex={-1}
            type="text"
          />
        </Surface>
      </Surface>

      <Surface className="flex w-full flex-col gap-1" variant="transparent">
        <Label htmlFor="partner-zip-code">{copy.zipCodeLabel}</Label>
        <input
          className="admin-native-text"
          defaultValue={defaults?.zipCode ?? ""}
          id="partner-zip-code"
          inputMode="numeric"
          maxLength={5}
          name="zip_code"
          required
          type="text"
        />
        <Description>{copy.zipCodeHint}</Description>
      </Surface>

      <TextField defaultValue={defaults?.street} fullWidth isRequired name="street">
        <Label>{copy.streetLabel}</Label>
        <Input />
      </TextField>

      <TextField defaultValue={defaults?.houseNumber} fullWidth isRequired name="house_number">
        <Label>{copy.houseNumberLabel}</Label>
        <Input />
      </TextField>

      <TextField defaultValue={defaults?.addressLine2 ?? undefined} fullWidth name="address_line2">
        <Label>{copy.addressLine2Label}</Label>
        <Input />
      </TextField>

      <input name="country" type="hidden" value={defaults?.country ?? "DE"} />
      <input name="city" type="hidden" value={defaults?.city ?? "berlin"} />

      <PartnerLogoUpload
        currentCredit={defaults?.currentLogoCredit}
        currentLogoImageId={defaults?.currentLogoImageId}
        currentLogoUrl={defaults?.currentLogoUrl}
        imagePublicBaseUrl={defaults?.imagePublicBaseUrl}
        isEdit={isEdit}
        locale={locale}
      />

      <Surface className="flex w-full flex-col gap-3" variant="transparent">
        <Label>{copy.openingHoursLabel}</Label>
        <Surface className="onboarding-form__options" variant="transparent">
          <NativePreferenceOption
            defaultChecked={hasOpeningHours}
            inputLabel={copy.openingHoursLabel}
            label={copy.optionYes}
            name="has_opening_hours"
            onChange={(event) => setHasOpeningHours(event.target.checked)}
            type="checkbox"
            value="on"
          />
        </Surface>
        <Description>{copy.openingHoursHint}</Description>

        {hasOpeningHours ? (
          <Surface className="flex flex-col gap-3" variant="transparent">
            {OPENING_HOURS_DAY_KEYS.map((day) => (
              <OpeningHoursDayRow
                closeLabel={copy.openingHoursCloseLabel}
                closedLabel={copy.openingHoursClosedLabel}
                day={day}
                dayLabel={copy.openingHoursDayLabels[day]}
                defaults={openingHoursDays[day]}
                key={`${day}-${hoursEpoch}`}
                openLabel={copy.openingHoursOpenLabel}
              />
            ))}
          </Surface>
        ) : null}
      </Surface>

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

      <Surface className="flex w-full flex-col gap-1" variant="transparent">
        <Label htmlFor="partner-bank-details">{copy.bankDetailsLabel}</Label>
        <textarea
          className="admin-native-textarea"
          defaultValue={defaults?.bankDetails ?? ""}
          id="partner-bank-details"
          maxLength={2000}
          name="bank_details"
          rows={5}
        />
        <Description>{copy.bankDetailsHint}</Description>
      </Surface>

      <Surface className="flex flex-col gap-3 sm:flex-row sm:items-center" variant="transparent">
        <Button className="button button--primary button--md sm:min-w-40" type="submit">
          {submitLabel}
        </Button>
        <Link className="button button--secondary button--md sm:min-w-40" href={cancelHref}>
          {copy.cancel}
        </Link>
      </Surface>
    </Form>
  );
}

export function partnerListPath(locale: Locale): string {
  return localizedPath(locale, "admin/partners");
}
