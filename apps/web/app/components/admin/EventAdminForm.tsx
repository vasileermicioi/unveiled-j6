"use client";

import { Button, Form, Label, Link, ProgressBar, Surface } from "@heroui/react";
import { useEffect, useRef, useState } from "react";

import { getAdminCopy } from "../../lib/admin-content";
import type { EventFormStep } from "../../lib/admin-event-form";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

import { AdminFormError } from "./AdminFormError";
import { EventAdminBaseFields } from "./EventAdminBaseFields";
import type { EventFormDefaults, PartnerOption } from "./event-admin-types";

const EVENT_FORM_STEP_COUNT = 3;

type EventAdminFormProps = {
  locale: Locale;
  action: string;
  submitLabel: string;
  cancelHref: string;
  partners: PartnerOption[];
  defaults?: EventFormDefaults;
  error?: string | null;
  isEdit?: boolean;
  initialStep?: EventFormStep;
};

function isFormControl(
  el: Element,
): el is HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement {
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLSelectElement ||
    el instanceof HTMLTextAreaElement
  );
}

function stepFromElement(el: Element): EventFormStep | null {
  const section = el.closest("[data-event-form-step]");
  const n = Number(section?.getAttribute("data-event-form-step"));
  if (n === 1 || n === 2 || n === 3) {
    return n;
  }
  return null;
}

function reportFirstInvalidInStep(form: HTMLFormElement, step: EventFormStep): boolean {
  const section = form.querySelector(`[data-event-form-step="${step}"]`);
  if (!section) {
    return true;
  }

  const candidates = section.querySelectorAll("input, select, textarea");
  for (const el of candidates) {
    if (!isFormControl(el) || el.disabled || !el.willValidate) {
      continue;
    }
    if (!el.checkValidity()) {
      el.reportValidity();
      return false;
    }
  }

  return true;
}

export function EventAdminForm({
  locale,
  action,
  submitLabel,
  cancelHref,
  partners,
  defaults,
  error = null,
  isEdit = false,
  initialStep = 1,
}: EventAdminFormProps) {
  const copy = getAdminCopy(locale);
  const [step, setStep] = useState<EventFormStep>(initialStep);
  const [maxReached, setMaxReached] = useState<EventFormStep>(initialStep);
  const formRef = useRef<HTMLFormElement | null>(null);
  const stepRef = useRef(step);
  const pendingInvalidRef = useRef<HTMLElement | null>(null);

  stepRef.current = step;

  const stepTitles: Record<EventFormStep, string> = {
    1: copy.wizardStepGeneral,
    2: copy.wizardStepDateTickets,
    3: copy.wizardStepImage,
  };

  function goToStep(next: EventFormStep) {
    setStep(next);
    setMaxReached((current) => (next > current ? next : current));
  }

  function goNext() {
    const form = formRef.current;
    if (!form) {
      return;
    }
    if (!reportFirstInvalidInStep(form, step)) {
      return;
    }
    if (step < EVENT_FORM_STEP_COUNT) {
      goToStep((step + 1) as EventFormStep);
    }
  }

  function bindForm(node: HTMLFormElement | null) {
    formRef.current = node;
  }

  useEffect(() => {
    const form = formRef.current;
    if (!form) {
      return;
    }

    const onInvalid = (event: Event) => {
      const target = event.target;
      if (!(target instanceof HTMLElement)) {
        return;
      }
      const owner = stepFromElement(target);
      if (owner == null || owner === stepRef.current) {
        return;
      }
      event.preventDefault();
      if (!pendingInvalidRef.current) {
        pendingInvalidRef.current = target;
        setStep(owner);
        setMaxReached((current) => (owner > current ? owner : current));
      }
    };

    form.addEventListener("invalid", onInvalid, true);
    return () => form.removeEventListener("invalid", onInvalid, true);
  }, []);

  useEffect(() => {
    const pending = pendingInvalidRef.current;
    if (!pending) {
      return;
    }
    pendingInvalidRef.current = null;
    if (isFormControl(pending) && stepFromElement(pending) === step) {
      pending.reportValidity();
    }
  }, [step]);

  return (
    <Form
      action={action}
      className="admin-form flex flex-col gap-6"
      encType="multipart/form-data"
      method="post"
      ref={bindForm}
    >
      {error ? <AdminFormError message={error} /> : null}

      <Surface className="flex flex-col gap-3" variant="transparent">
        <ProgressBar
          aria-label={copy.wizardStepProgress(step, EVENT_FORM_STEP_COUNT)}
          maxValue={EVENT_FORM_STEP_COUNT}
          minValue={0}
          value={step}
        >
          <Label>{copy.wizardStepProgress(step, EVENT_FORM_STEP_COUNT)}</Label>
          <ProgressBar.Track>
            <ProgressBar.Fill />
          </ProgressBar.Track>
        </ProgressBar>
        <Surface className="flex flex-wrap gap-2" variant="transparent">
          {([1, 2, 3] as const).map((n) => {
            const current = n === step;
            const reachable = isEdit || n <= maxReached;
            const title = stepTitles[n];
            return (
              <Button
                aria-current={current ? "step" : undefined}
                className={
                  current
                    ? "button button--primary button--md"
                    : "button button--secondary button--md"
                }
                isDisabled={!reachable}
                key={n}
                onPress={() => {
                  if (reachable) {
                    setStep(n);
                  }
                }}
                type="button"
              >
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
            onPress={() => setStep((current) => (current - 1) as EventFormStep)}
            type="button"
          >
            {copy.wizardBack}
          </Button>
        ) : null}
        {!isEdit && step < EVENT_FORM_STEP_COUNT ? (
          <Button
            className="button button--primary button--md sm:min-w-40"
            onPress={goNext}
            type="button"
          >
            {copy.wizardNext}
          </Button>
        ) : null}
        {isEdit || step === EVENT_FORM_STEP_COUNT ? (
          <Button className="button button--primary button--md sm:min-w-40" type="submit">
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
