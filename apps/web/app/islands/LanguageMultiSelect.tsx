import CheckboxMultiSelect from "./CheckboxMultiSelect";

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

/**
 * Searchable preferred-languages multi-select for onboarding + profile Vibes.
 * Thin wrapper over CheckboxMultiSelect; native checkboxes post on SSR form submit.
 */
export default function LanguageMultiSelect({
  name,
  options,
  selected,
  filterPlaceholder,
}: LanguageMultiSelectProps) {
  return (
    <CheckboxMultiSelect
      enableSearch
      filterPlaceholder={filterPlaceholder}
      name={name}
      options={options.map((option) => ({ value: option.code, label: option.label }))}
      selected={selected}
    />
  );
}
