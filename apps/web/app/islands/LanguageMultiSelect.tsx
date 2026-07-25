import { Label, Surface } from "@heroui/react";
import { useMemo, useState } from "react";

export type LanguageMultiSelectOption = {
  code: string;
  label: string;
};

type LanguageMultiSelectProps = {
  name: string;
  options: LanguageMultiSelectOption[];
  selected: string[];
  filterPlaceholder: string;
};

function optionId(name: string, value: string): string {
  return `${name}-${value}`.replace(/[^a-zA-Z0-9_-]+/g, "-");
}

function matchesFilter(option: LanguageMultiSelectOption, filter: string): boolean {
  const normalized = filter.trim().toLowerCase();
  if (!normalized) {
    return true;
  }
  return (
    option.label.toLowerCase().includes(normalized) ||
    option.code.toLowerCase().includes(normalized)
  );
}

/**
 * Searchable preferred-languages multi-select for onboarding + profile Vibes.
 * Client-side filter only; native checkboxes post on SSR form submit.
 * Selected values stay mounted (and POST) even when they do not match the filter.
 */
export default function LanguageMultiSelect({
  name,
  options,
  selected,
  filterPlaceholder,
}: LanguageMultiSelectProps) {
  const [filter, setFilter] = useState("");
  const [selectedCodes, setSelectedCodes] = useState(() => {
    const allowlist = new Set(options.map((option) => option.code));
    return selected.filter((code) => allowlist.has(code));
  });

  const selectedSet = useMemo(() => new Set(selectedCodes), [selectedCodes]);
  const selectedOptions = options.filter((option) => selectedSet.has(option.code));
  const filterActive = filter.trim().length > 0;

  const visibleOptions = filterActive
    ? options.filter((option) => matchesFilter(option, filter) && !selectedSet.has(option.code))
    : options;

  function toggle(code: string, checked: boolean) {
    setSelectedCodes((current) => {
      if (checked) {
        if (current.includes(code)) {
          return current;
        }
        return [...current, code];
      }
      return current.filter((value) => value !== code);
    });
  }

  return (
    <Surface className="onboarding-form__language-select flex flex-col gap-4" variant="transparent">
      <input
        aria-label={filterPlaceholder}
        className="onboarding-form__language-filter"
        onChange={(event) => setFilter(event.target.value)}
        placeholder={filterPlaceholder}
        type="search"
        value={filter}
      />

      {filterActive && selectedOptions.length > 0 ? (
        <Surface
          className="onboarding-form__options onboarding-form__options--grid-three"
          variant="transparent"
        >
          {selectedOptions.map((option) => (
            <Label
              className="onboarding-form__option"
              htmlFor={optionId(name, option.code)}
              key={`selected-${option.code}`}
            >
              <input
                checked
                className="onboarding-form__native-control"
                id={optionId(name, option.code)}
                name={name}
                onChange={(event) => toggle(option.code, event.target.checked)}
                type="checkbox"
                value={option.code}
              />
              <span className="onboarding-form__option-text">{option.label}</span>
            </Label>
          ))}
        </Surface>
      ) : null}

      <Surface
        className="onboarding-form__options onboarding-form__options--grid-three"
        variant="transparent"
      >
        {visibleOptions.map((option) => {
          const checked = selectedSet.has(option.code);
          return (
            <Label
              className="onboarding-form__option"
              htmlFor={optionId(name, option.code)}
              key={option.code}
            >
              <input
                checked={checked}
                className="onboarding-form__native-control"
                id={optionId(name, option.code)}
                name={name}
                onChange={(event) => toggle(option.code, event.target.checked)}
                type="checkbox"
                value={option.code}
              />
              <span className="onboarding-form__option-text">{option.label}</span>
            </Label>
          );
        })}
      </Surface>
    </Surface>
  );
}
