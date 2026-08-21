"use client";

import { Alert, Button, Surface } from "@heroui/react";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

import { getAdminCopy } from "../../lib/admin-content";
import { isWizardAdvanceSubmit } from "../../lib/admin-event-wizard";
import {
  applyFieldsToForm,
  clearStoredDraft,
  discardDraftNavigation,
  dispatchFormDraftApplied,
  dispatchFormDraftFlush,
  FORM_DRAFT_SAVE_DEBOUNCE_MS,
  readStoredDraft,
  rememberAppliedDraftFields,
  serializeFormFields,
  writeStoredDraft,
} from "../../lib/form-draft";
import type { Locale } from "../../lib/locale";

export type FormDraftPersistenceProps = {
  formId: string;
  locale: Locale;
  /** When true (failed persist re-render), snapshot SSR values if no draft exists. */
  seedIfEmpty?: boolean;
  /** After Discard, go here (wizard step 1). Same path reloads. */
  discardHref?: string;
};

export function FormDraftPersistence({
  formId,
  locale,
  seedIfEmpty = false,
  discardHref,
}: FormDraftPersistenceProps) {
  const copy = getAdminCopy(locale);
  const formRef = useRef<HTMLFormElement | null>(null);
  const restoringRef = useRef(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [didRestore, setDidRestore] = useState(false);

  const findForm = useCallback((): HTMLFormElement | null => {
    if (formRef.current) {
      return formRef.current;
    }
    const form =
      document.querySelector<HTMLFormElement>(`form[data-form-draft-id="${CSS.escape(formId)}"]`) ??
      document.querySelector<HTMLFormElement>("form.admin-form");
    formRef.current = form;
    return form;
  }, [formId]);

  const snapshotForm = useCallback(
    (form: HTMLFormElement) => {
      dispatchFormDraftFlush(form);
      writeStoredDraft(window.localStorage, formId, serializeFormFields(form));
    },
    [formId],
  );

  const discardDraft = useCallback(() => {
    clearStoredDraft(window.localStorage, formId);
    const next = discardDraftNavigation(
      window.location.pathname,
      window.location.search,
      discardHref,
    );
    if (next.kind === "assign") {
      window.location.assign(next.href);
      return;
    }
    window.location.reload();
  }, [discardHref, formId]);

  useLayoutEffect(() => {
    const form = findForm();
    if (!form) {
      return;
    }

    restoringRef.current = true;
    const stored = readStoredDraft(window.localStorage, formId);
    if (stored) {
      const restored = applyFieldsToForm(form, stored.fields);
      rememberAppliedDraftFields(form, stored.fields);
      // Discard stays available whenever a draft exists. "Restored" only when
      // localStorage actually put values back (refresh / GET another step).
      // Wizard Next already paints posted fields, so apply() is a no-op.
      setHasDraft(true);
      setDidRestore(restored);
      queueMicrotask(() => {
        dispatchFormDraftApplied(form, stored.fields);
        restoringRef.current = false;
      });
    } else {
      setHasDraft(false);
      setDidRestore(false);
      if (seedIfEmpty) {
        queueMicrotask(() => {
          snapshotForm(form);
        });
      }
      restoringRef.current = false;
    }

    const scheduleSave = () => {
      if (restoringRef.current) {
        return;
      }
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      saveTimerRef.current = setTimeout(() => {
        const current = findForm();
        if (current) {
          snapshotForm(current);
          setHasDraft(true);
        }
      }, FORM_DRAFT_SAVE_DEBOUNCE_MS);
    };

    const onSubmit = (event: Event) => {
      if (isWizardAdvanceSubmit(event)) {
        const current = findForm();
        if (current) {
          snapshotForm(current);
        }
        return;
      }
      clearStoredDraft(window.localStorage, formId);
    };

    form.addEventListener("input", scheduleSave);
    form.addEventListener("change", scheduleSave);
    form.addEventListener("submit", onSubmit);

    return () => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }
      form.removeEventListener("input", scheduleSave);
      form.removeEventListener("change", scheduleSave);
      form.removeEventListener("submit", onSubmit);
    };
  }, [findForm, formId, seedIfEmpty, snapshotForm]);

  if (!hasDraft) {
    return null;
  }

  const discardButton = (
    <Button className="button button--secondary button--md" onPress={discardDraft} type="button">
      {copy.discardDraft}
    </Button>
  );

  if (didRestore) {
    return (
      <Alert status="accent">
        <Alert.Indicator />
        <Alert.Content>
          <Alert.Title>{copy.draftRestored}</Alert.Title>
        </Alert.Content>
        {discardButton}
      </Alert>
    );
  }

  return (
    <Surface className="flex w-full justify-end" variant="transparent">
      {discardButton}
    </Surface>
  );
}
