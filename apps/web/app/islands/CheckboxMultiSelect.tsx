import { Label, Surface } from "@heroui/react";
import { useMemo, useState } from "react";

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
  optionsClassName = "checkbox-multi-select__options checkbox-multi-select__options--grid-three onboarding-form__options onboarding-form__options--grid-three",
}: CheckboxMultiSelectProps) {
  const [filter, setFilter] = useState("");
  const [selectedValues, setSelectedValues] = useState(() => {
    const allowlist = new Set(options.map((option) => option.value));
    return selected.filter((value) => allowlist.has(value));
  });

  const selectedSet = useMemo(() => new Set(selectedValues), [selectedValues]);
  const selectedOptions = options.filter((option) => selectedSet.has(option.value));
  const filterActive = enableSearch && filter.trim().length > 0;

  const visibleOptions = filterActive
    ? options.filter((option) => matchesFilter(option, filter) && !selectedSet.has(option.value))
    : options;

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
      variant="transparent"
    >
      {enableSearch ? (
        <input
          aria-label={filterPlaceholder}
          className="checkbox-multi-select__filter onboarding-form__language-filter"
          onChange={(event) => setFilter(event.target.value)}
          placeholder={filterPlaceholder}
          type="search"
          value={filter}
        />
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
