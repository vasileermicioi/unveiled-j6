export const FORM_DRAFT_VERSION = 1;
export const FORM_DRAFT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
export const FORM_DRAFT_KEY_PREFIX = "unveiled:form-draft:v1:";
export const WIZARD_INTENT_NAME = "wizard_intent";
export const FORM_DRAFT_FLUSH_EVENT = "unveiled:form-draft-flush";
export const FORM_DRAFT_APPLIED_EVENT = "unveiled:form-draft-applied";
export const FORM_DRAFT_SAVE_DEBOUNCE_MS = 300;

const SKIP_INPUT_TYPES = new Set(["file", "submit", "button", "reset", "image"]);

export type FormDraftFields = Record<string, string | string[]>;

export type FormDraftPayload = {
  v: typeof FORM_DRAFT_VERSION;
  savedAt: number;
  fields: FormDraftFields;
};

export type NamedFieldSnapshot = {
  name: string;
  type: string;
  value: string;
  checked?: boolean;
};

export type FormDraftFlushDetail = {
  form: HTMLFormElement;
};

export type FormDraftAppliedDetail = {
  form: HTMLFormElement;
  fields: FormDraftFields;
};

export type DraftStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

const lastAppliedFields = new WeakMap<HTMLFormElement, FormDraftFields>();

export function draftStorageKey(formId: string): string {
  return `${FORM_DRAFT_KEY_PREFIX}${formId}`;
}

export function shouldSkipNamedField(name: string, type: string): boolean {
  if (!name) {
    return true;
  }
  if (name === WIZARD_INTENT_NAME) {
    return true;
  }
  return SKIP_INPUT_TYPES.has(type.toLowerCase());
}

function appendFieldValue(fields: FormDraftFields, name: string, value: string): void {
  const existing = fields[name];
  if (existing === undefined) {
    fields[name] = value;
    return;
  }
  if (Array.isArray(existing)) {
    existing.push(value);
    return;
  }
  fields[name] = [existing, value];
}

export function serializeNamedFields(fields: readonly NamedFieldSnapshot[]): FormDraftFields {
  const result: FormDraftFields = {};
  for (const field of fields) {
    if (shouldSkipNamedField(field.name, field.type)) {
      continue;
    }
    const type = field.type.toLowerCase();
    if (type === "checkbox" || type === "radio") {
      if (!field.checked) {
        continue;
      }
      appendFieldValue(result, field.name, field.value === "" ? "on" : field.value);
      continue;
    }
    appendFieldValue(result, field.name, field.value);
  }
  return result;
}

export function draftFieldValues(fields: FormDraftFields, name: string): string[] {
  const value = fields[name];
  if (value === undefined) {
    return [];
  }
  return Array.isArray(value) ? value : [value];
}

export function draftFieldValue(fields: FormDraftFields, name: string): string | undefined {
  return draftFieldValues(fields, name)[0];
}

export function restoreNamedField(
  field: NamedFieldSnapshot,
  fields: FormDraftFields,
): NamedFieldSnapshot | null {
  if (shouldSkipNamedField(field.name, field.type)) {
    return null;
  }
  const type = field.type.toLowerCase();
  if (type === "checkbox" || type === "radio") {
    const values = draftFieldValues(fields, field.name);
    return { ...field, checked: values.includes(field.value) };
  }
  if (!(field.name in fields)) {
    return field;
  }
  return { ...field, value: draftFieldValue(fields, field.name) ?? "" };
}

export function createDraftPayload(
  fields: FormDraftFields,
  savedAt = Date.now(),
): FormDraftPayload {
  return { v: FORM_DRAFT_VERSION, savedAt, fields };
}

export function isDraftExpired(payload: { savedAt: number }, now = Date.now()): boolean {
  return now - payload.savedAt > FORM_DRAFT_TTL_MS;
}

function isDraftPayload(value: unknown): value is FormDraftPayload {
  if (!value || typeof value !== "object") {
    return false;
  }
  const record = value as Record<string, unknown>;
  if (record.v !== FORM_DRAFT_VERSION || typeof record.savedAt !== "number") {
    return false;
  }
  if (!Number.isFinite(record.savedAt)) {
    return false;
  }
  if (!record.fields || typeof record.fields !== "object" || Array.isArray(record.fields)) {
    return false;
  }
  for (const fieldValue of Object.values(record.fields as Record<string, unknown>)) {
    if (typeof fieldValue === "string") {
      continue;
    }
    if (Array.isArray(fieldValue) && fieldValue.every((entry) => typeof entry === "string")) {
      continue;
    }
    return false;
  }
  return true;
}

export function parseDraft(
  raw: string | null | undefined,
  now = Date.now(),
): FormDraftPayload | null {
  if (raw == null || raw === "") {
    return null;
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isDraftPayload(parsed)) {
      return null;
    }
    if (isDraftExpired(parsed, now)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function readStoredDraft(
  storage: DraftStorage,
  formId: string,
  now = Date.now(),
): FormDraftPayload | null {
  const key = draftStorageKey(formId);
  const raw = storage.getItem(key);
  if (raw == null) {
    return null;
  }
  const parsed = parseDraft(raw, now);
  if (!parsed) {
    storage.removeItem(key);
    return null;
  }
  return parsed;
}

export function writeStoredDraft(
  storage: DraftStorage,
  formId: string,
  fields: FormDraftFields,
  savedAt = Date.now(),
): void {
  try {
    storage.setItem(draftStorageKey(formId), JSON.stringify(createDraftPayload(fields, savedAt)));
  } catch {
    // QuotaExceededError / private mode — form stays usable without a draft.
  }
}

export function clearStoredDraft(storage: DraftStorage, formId: string): void {
  storage.removeItem(draftStorageKey(formId));
}

export function rememberAppliedDraftFields(form: HTMLFormElement, fields: FormDraftFields): void {
  lastAppliedFields.set(form, fields);
}

export function lastAppliedDraftFields(form: HTMLFormElement): FormDraftFields | undefined {
  return lastAppliedFields.get(form);
}

export function collectFormFieldSnapshots(form: HTMLFormElement): NamedFieldSnapshot[] {
  const snapshots: NamedFieldSnapshot[] = [];
  for (const element of Array.from(form.elements)) {
    if (element instanceof HTMLSelectElement) {
      if (element.multiple) {
        const selected = Array.from(element.selectedOptions);
        if (selected.length === 0) {
          snapshots.push({ name: element.name, type: "select", value: "" });
        } else {
          for (const option of selected) {
            snapshots.push({ name: element.name, type: "select", value: option.value });
          }
        }
      } else {
        snapshots.push({ name: element.name, type: "select", value: element.value });
      }
      continue;
    }
    if (element instanceof HTMLTextAreaElement) {
      snapshots.push({ name: element.name, type: "textarea", value: element.value });
      continue;
    }
    if (element instanceof HTMLInputElement) {
      snapshots.push({
        name: element.name,
        type: element.type,
        value: element.value,
        checked: element.checked,
      });
    }
  }
  return snapshots;
}

export function serializeFormFields(form: HTMLFormElement): FormDraftFields {
  return serializeNamedFields(collectFormFieldSnapshots(form));
}

function dispatchRestoreEvents(element: HTMLElement): void {
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

export function applyFieldsToForm(form: HTMLFormElement, fields: FormDraftFields): boolean {
  let changed = false;
  for (const element of Array.from(form.elements)) {
    if (element instanceof HTMLInputElement) {
      const restored = restoreNamedField(
        {
          name: element.name,
          type: element.type,
          value: element.value,
          checked: element.checked,
        },
        fields,
      );
      if (!restored) {
        continue;
      }
      const type = element.type.toLowerCase();
      if (type === "checkbox" || type === "radio") {
        if (element.checked !== Boolean(restored.checked)) {
          element.checked = Boolean(restored.checked);
          changed = true;
          dispatchRestoreEvents(element);
        }
        continue;
      }
      if (element.value !== restored.value) {
        element.value = restored.value;
        changed = true;
        dispatchRestoreEvents(element);
      }
      continue;
    }
    if (element instanceof HTMLTextAreaElement) {
      const restored = restoreNamedField(
        { name: element.name, type: "textarea", value: element.value },
        fields,
      );
      if (!restored) {
        continue;
      }
      if (element.value !== restored.value) {
        element.value = restored.value;
        changed = true;
        dispatchRestoreEvents(element);
      }
      continue;
    }
    if (element instanceof HTMLSelectElement) {
      if (shouldSkipNamedField(element.name, "select")) {
        continue;
      }
      if (element.multiple) {
        const values = new Set(draftFieldValues(fields, element.name));
        let selectChanged = false;
        for (const option of Array.from(element.options)) {
          const next = values.has(option.value);
          if (option.selected !== next) {
            option.selected = next;
            selectChanged = true;
          }
        }
        if (selectChanged) {
          changed = true;
          dispatchRestoreEvents(element);
        }
        continue;
      }
      const restored = restoreNamedField(
        { name: element.name, type: "select", value: element.value },
        fields,
      );
      if (!restored) {
        continue;
      }
      if (element.value !== restored.value) {
        element.value = restored.value;
        changed = true;
        dispatchRestoreEvents(element);
      }
    }
  }
  return changed;
}

export function dispatchFormDraftFlush(form: HTMLFormElement): void {
  document.dispatchEvent(
    new CustomEvent<FormDraftFlushDetail>(FORM_DRAFT_FLUSH_EVENT, {
      detail: { form },
    }),
  );
}

export function dispatchFormDraftApplied(form: HTMLFormElement, fields: FormDraftFields): void {
  rememberAppliedDraftFields(form, fields);
  form.dispatchEvent(
    new CustomEvent<FormDraftAppliedDetail>(FORM_DRAFT_APPLIED_EVENT, {
      bubbles: true,
      detail: { form, fields },
    }),
  );
}

function normalizePathname(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith("/")) {
    return pathname.slice(0, -1);
  }
  return pathname || "/";
}

/** Where Discard should go after clearing storage. Same-path → reload. */
export function discardDraftNavigation(
  currentPathname: string,
  currentSearch: string,
  discardHref: string | undefined,
): { kind: "reload" } | { kind: "assign"; href: string } {
  if (!discardHref) {
    return { kind: "reload" };
  }
  const target = new URL(discardHref, "http://local.invalid");
  if (
    normalizePathname(target.pathname) === normalizePathname(currentPathname) &&
    target.search === currentSearch
  ) {
    return { kind: "reload" };
  }
  return { kind: "assign", href: `${target.pathname}${target.search}` };
}
