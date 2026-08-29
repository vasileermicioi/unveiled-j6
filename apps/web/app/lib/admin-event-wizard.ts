import type { EventFormStep } from "./admin-event-form";
import type { Locale } from "./locale";
import { localizedPath } from "./locale";

export const EVENT_WIZARD_STEP_COUNT = 3;

export type EventWizardIntent = "next" | "back" | "create" | "save";

export type EventWizardTarget = { kind: "new" } | { kind: "edit"; eventId: string };

export function eventAdminFormDraftId(target: EventWizardTarget): string {
  return target.kind === "edit" ? `admin-event:${target.eventId}` : "admin-event:new";
}

export function eventWizardStepPath(
  locale: Locale,
  target: EventWizardTarget,
  step: EventFormStep,
): string {
  const base = target.kind === "new" ? "admin/events/new" : `admin/events/${target.eventId}/edit`;
  if (step === 2) {
    return localizedPath(locale, `${base}/dates`);
  }
  if (step === 3) {
    return localizedPath(locale, `${base}/image`);
  }
  return localizedPath(locale, base);
}

export function eventWizardStepHrefs(
  locale: Locale,
  target: EventWizardTarget,
): Record<EventFormStep, string> {
  return {
    1: eventWizardStepPath(locale, target, 1),
    2: eventWizardStepPath(locale, target, 2),
    3: eventWizardStepPath(locale, target, 3),
  };
}

export function parseWizardIntent(raw: string | undefined): EventWizardIntent {
  if (raw === "next" || raw === "back" || raw === "create") {
    return raw;
  }
  return "save";
}

/**
 * Create Next POSTs to the destination step URL. Validate the step being left,
 * not the destination (image must not re-check dates/redemption).
 */
export function eventWizardLeavingStep(
  intent: EventWizardIntent,
  postedStep: EventFormStep,
): EventFormStep | null {
  if (intent !== "next" || postedStep <= 1) {
    return null;
  }
  return (postedStep - 1) as EventFormStep;
}

export function submitterFromSubmitEvent(
  event: Event,
): HTMLButtonElement | HTMLInputElement | null {
  if (typeof SubmitEvent === "undefined" || !(event instanceof SubmitEvent)) {
    return null;
  }
  const submitter = event.submitter;
  if (submitter instanceof HTMLButtonElement || submitter instanceof HTMLInputElement) {
    return submitter;
  }
  return null;
}

/** True when the submitter is create-wizard Next/Back (not a persist). */
export function isWizardAdvanceSubmit(event: Event): boolean {
  const submitter = submitterFromSubmitEvent(event);
  if (submitter?.name !== "wizard_intent") {
    return false;
  }
  return submitter.value === "next" || submitter.value === "back";
}

/** Re-submit after async work, keeping the original button's formaction / wizard_intent. */
export function resubmitFormWithSubmitter(form: HTMLFormElement, event: Event): void {
  const submitter = submitterFromSubmitEvent(event);
  if (submitter && submitter.form === form) {
    form.requestSubmit(submitter);
    return;
  }
  form.requestSubmit();
}
