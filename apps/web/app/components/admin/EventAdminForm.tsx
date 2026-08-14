"use client";

import { Button, Form, Label, Link, ProgressBar, Surface } from "@heroui/react";

import { getAdminCopy } from "../../lib/admin-content";
import type { EventFormStep } from "../../lib/admin-event-form";
import { EVENT_WIZARD_STEP_COUNT } from "../../lib/admin-event-wizard";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

import { AdminFormError } from "./AdminFormError";
import { EventAdminBaseFields } from "./EventAdminBaseFields";
import type { EventFormDefaults, PartnerOption } from "./event-admin-types";

type EventAdminFormProps = {
  locale: Locale;
  action: string;
  submitLabel: string;
  cancelHref: string;
  partners: PartnerOption[];
  defaults?: EventFormDefaults;
  error?: string | null;
  isEdit?: boolean;
  step: EventFormStep;
  stepHrefs: Record<EventFormStep, string>;
};

export function EventAdminForm({
  locale,
  action,
  submitLabel,
  cancelHref,
  partners,
  defaults,
  error = null,
  isEdit = false,
  step,
  stepHrefs,
}: EventAdminFormProps) {
  const copy = getAdminCopy(locale);

  const stepTitles: Record<EventFormStep, string> = {
    1: copy.wizardStepGeneral,
    2: copy.wizardStepDateTickets,
    3: copy.wizardStepImage,
  };

  return (
    <Form
      action={action}
      className="admin-form flex flex-col gap-6"
      encType="multipart/form-data"
      method="post"
    >
      {error ? <AdminFormError message={error} /> : null}

      <Surface className="flex flex-col gap-3" variant="transparent">
        <ProgressBar
          aria-label={copy.wizardStepProgress(step, EVENT_WIZARD_STEP_COUNT)}
          maxValue={EVENT_WIZARD_STEP_COUNT}
          minValue={0}
          value={step}
        >
          <Label>{copy.wizardStepProgress(step, EVENT_WIZARD_STEP_COUNT)}</Label>
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
        <Surface className="flex flex-wrap gap-2" variant="transparent">
          {([1, 2, 3] as const).map((n) => {
            const current = n === step;
            const title = stepTitles[n];
            const className = current
              ? "button button--primary button--md"
              : "button button--secondary button--md";

            if (isEdit) {
              return (
                <Link
                  aria-current={current ? "step" : undefined}
                  className={className}
                  href={stepHrefs[n]}
                  key={n}
                >
                  {title}
                </Link>
              );
            }

            if (current) {
              return (
                <Button aria-current="step" className={className} key={n} type="button">
                  {title}
                </Button>
              );
            }

            if (n < step) {
              return (
                <Button
                  className={className}
                  formAction={stepHrefs[n]}
                  key={n}
                  name="wizard_intent"
                  type="submit"
                  value="back"
                >
                  {title}
                </Button>
              );
            }

            return (
              <Button className={className} isDisabled key={n} type="button">
                {title}
              </Button>
            );
          })}
        </Surface>
      </Surface>

      <EventAdminBaseFields
        activeStep={step}
        defaults={defaults}
        includeDateTime
        isEdit={isEdit}
        locale={locale}
        partners={partners}
      />

      <Surface className="flex flex-col gap-3 sm:flex-row sm:items-center" variant="transparent">
        {!isEdit && step > 1 ? (
          <Button
            className="button button--secondary button--md sm:min-w-40"
            formAction={stepHrefs[(step - 1) as EventFormStep]}
            name="wizard_intent"
            type="submit"
            value="back"
          >
            {copy.wizardBack}
          </Button>
        ) : null}
        {!isEdit && step < EVENT_WIZARD_STEP_COUNT ? (
          <Button
            className="button button--primary button--md sm:min-w-40"
            formAction={stepHrefs[(step + 1) as EventFormStep]}
            name="wizard_intent"
            type="submit"
            value="next"
          >
            {copy.wizardNext}
          </Button>
        ) : null}
        {isEdit ? (
          <Button className="button button--primary button--md sm:min-w-40" type="submit">
            {submitLabel}
          </Button>
        ) : null}
        {!isEdit && step === EVENT_WIZARD_STEP_COUNT ? (
          <Button
            className="button button--primary button--md sm:min-w-40"
            name="wizard_intent"
            type="submit"
            value="create"
          >
            {submitLabel}
          </Button>
        ) : null}
        <Link className="button button--secondary button--md sm:min-w-40" href={cancelHref}>
          {copy.cancel}
        </Link>
      </Surface>
    </Form>
  );
}

export function eventListPath(locale: Locale): string {
  return localizedPath(locale, "admin/events");
}

export type { EventFormDefaults, PartnerOption } from "./event-admin-types";
export type { EventFormStep };
