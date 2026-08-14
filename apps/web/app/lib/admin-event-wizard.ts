import type { EventFormStep } from "./admin-event-form";
import type { Locale } from "./locale";
import { localizedPath } from "./locale";

export const EVENT_WIZARD_STEP_COUNT = 3;

export type EventWizardIntent = "next" | "back" | "create" | "save";

export type EventWizardTarget = { kind: "new" } | { kind: "edit"; eventId: string };

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

/** True when the submitter is create-wizard Next/Back (not a persist). */
export function isWizardAdvanceSubmit(event: Event): boolean {
  if (!(event instanceof SubmitEvent)) {
    return false;
  }
  const submitter = event.submitter;
  if (!(submitter instanceof HTMLButtonElement) && !(submitter instanceof HTMLInputElement)) {
    return false;
  }
  if (submitter.name !== "wizard_intent") {
    return false;
  }
  return submitter.value === "next" || submitter.value === "back";
}
