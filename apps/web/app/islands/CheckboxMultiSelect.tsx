import { Description, Label, Surface } from "@heroui/react";
import { useLayoutEffect, useMemo, useRef, useState } from "react";

import {
  draftFieldValues,
  FORM_DRAFT_APPLIED_EVENT,
  type FormDraftAppliedDetail,
  type FormDraftFields,
  lastAppliedDraftFields,
} from "../lib/form-draft";

export type CheckboxMultiSelectOption = {
  value: string;
  label: string;
};

export type CheckboxMultiSelectProps = {
  name: string;
  options: CheckboxMultiSelectOption[];
  selected?: string[];
  /** When true, shows a search input that filters visible options. */
  enableSearch?: boolean;
  filterPlaceholder?: string;
  /** Hint under the search field (e.g. that more options require searching). */
  searchHint?: string;
  /**
   * When search is enabled and the filter is empty, only show this many options
   * (plus any already-selected values). Full allowlist remains searchable.
   */
  initialVisibleCount?: number;
  /** Optional layout class for the options grid (defaults to three-column onboarding grid). */
  optionsClassName?: string;
};

function optionId(name: string, value: string): string {
  return `${name}-${value}`.replace(/[^a-zA-Z0-9_-]+/g, "-");
}

function matchesFilter(option: CheckboxMultiSelectOption, filter: string): boolean {
  const normalized = filter.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  return (
    option.label.toLowerCase().includes(normalized) ||
    option.value.toLowerCase().includes(normalized)
  );
}

function selectedFromDraft(
  fields: FormDraftFields,
  name: string,
  allowlist: Set<string>,
): string[] {
  return draftFieldValues(fields, name).filter((value) => allowlist.has(value));
}

/**
 * Native-checkbox multi-select for SSR form POST array fields.
 * Optional client-side search; selected values stay mounted (and POST) even when filtered out.
 */
export default function CheckboxMultiSelect({
  name,
  options,
  selected = [],
  enableSearch = false,
  filterPlaceholder = "",
  searchHint,
  initialVisibleCount,
  optionsClassName = "checkbox-multi-select__options checkbox-multi-select__options--grid-three onboarding-form__options onboarding-form__options--grid-three",
}: CheckboxMultiSelectProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const allowlist = useMemo(() => new Set(options.map((option) => option.value)), [options]);
  const [filter, setFilter] = useState("");
  const [selectedValues, setSelectedValues] = useState(() =>
    selected.filter((value) => allowlist.has(value)),
  );

  useLayoutEffect(() => {
    function applyFields(fields: FormDraftFields) {
      setSelectedValues(selectedFromDraft(fields, name, allowlist));
    }

    function onApplied(event: Event) {
      const detail = (event as CustomEvent<FormDraftAppliedDetail>).detail;
      if (!detail?.fields) {
        return;
      }
      const form = rootRef.current?.closest("form");
      if (form && detail.form !== form) {
        return;
      }
      applyFields(detail.fields);
    }

    const form = rootRef.current?.closest("form");
    if (form) {
      const stored = lastAppliedDraftFields(form);
      if (stored && name in stored) {
        applyFields(stored);
      }
    }

    document.addEventListener(FORM_DRAFT_APPLIED_EVENT, onApplied);
    return () => {
      document.removeEventListener(FORM_DRAFT_APPLIED_EVENT, onApplied);
    };
  }, [allowlist, name]);

  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);
  const selectedOptions = options.filter((option) => selectedSet.has(option.value));
  const filterActive = enableSearch && filter.trim().length > 0;
  const collapseUnfiltered =
    enableSearch &&
    !filterActive &&
    typeof initialVisibleCount === "number" &&
    initialVisibleCount >= 0;

  const visibleOptions = useMemo(() => {
    if (filterActive) {
      return options.filter(
        (option) => matchesFilter(option, filter) && !selectedSet.has(option.value),
      );
    }
    if (collapseUnfiltered) {
      const defaultValues = new Set(
        options.slice(0, initialVisibleCount).map((option) => option.value),
      );
      return options.filter(
        (option) => defaultValues.has(option.value) || selectedSet.has(option.value),
      );
    }
    return options;
  }, [collapseUnfiltered, filter, filterActive, initialVisibleCount, options, selectedSet]);

  function toggle(value: string, checked: boolean) {
    setSelectedValues((current) => {
      if (checked) {
        if (current.includes(value)) {
          return current;
        }
        return [...current, value];
      }
      return current.filter((entry) => entry !== value);
    });
  }

  return (
    <Surface
      className="checkbox-multi-select onboarding-form__language-select flex flex-col gap-4"
      ref={rootRef}
      variant="transparent"
    >
      {enableSearch ? (
        <Surface className="flex flex-col gap-1" variant="transparent">
          <input
            aria-label={filterPlaceholder}
            className="checkbox-multi-select__filter onboarding-form__language-filter"
            onChange={(event) => setFilter(event.target.value)}
            placeholder={filterPlaceholder}
            type="search"
            value={filter}
          />
          {searchHint ? <Description>{searchHint}</Description> : null}
        </Surface>
      ) : null}

      {filterActive && selectedOptions.length > 0 ? (
        <Surface className={optionsClassName} variant="transparent">
          {selectedOptions.map((option) => (
            <Label
              className="checkbox-multi-select__option onboarding-form__option"
              htmlFor={optionId(name, option.value)}
              key={`selected-${option.value}`}
            >
              <input
                checked
                className="checkbox-multi-select__native-control onboarding-form__native-control"
                id={optionId(name, option.value)}
                name={name}
                onChange={(event) => toggle(option.value, event.target.checked)}
                type="checkbox"
                value={option.value}
              />
              <span className="checkbox-multi-select__option-text onboarding-form__option-text">
                {option.label}
              </span>
            </Label>
          ))}
        </Surface>
      ) : null}

      <Surface className={optionsClassName} variant="transparent">
        {visibleOptions.map((option) => {
          const checked = selectedSet.has(option.value);
          return (
            <Label
              className="checkbox-multi-select__option onboarding-form__option"
              htmlFor={optionId(name, option.value)}
              key={option.value}
            >
              <input
                checked={checked}
                className="checkbox-multi-select__native-control onboarding-form__native-control"
                id={optionId(name, option.value)}
                name={name}
                onChange={(event) => toggle(option.value, event.target.checked)}
                type="checkbox"
                value={option.value}
              />
              <span className="checkbox-multi-select__option-text onboarding-form__option-text">
                {option.label}
              </span>
            </Label>
          );
        })}
      </Surface>
    </Surface>
  );
}
