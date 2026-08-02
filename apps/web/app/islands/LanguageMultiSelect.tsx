import { FEATURED_PREFERRED_LANGUAGES } from "@unveiled/auth/constants";

import CheckboxMultiSelect from "./CheckboxMultiSelect";

export type LanguageMultiSelectOption = {
  code: string;
  label: string;
};

/** Matches curated Berlin-common featured list length (search reveals the rest). */
export const LANGUAGE_MULTI_SELECT_INITIAL_VISIBLE = FEATURED_PREFERRED_LANGUAGES.length;

type LanguageMultiSelectProps = {
  name: string;
  options: LanguageMultiSelectOption[];
  selected: string[];
  filterPlaceholder: string;
  searchHint: string;
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
  searchHint,
}: LanguageMultiSelectProps) {
  return (
    <CheckboxMultiSelect
      enableSearch
      filterPlaceholder={filterPlaceholder}
      initialVisibleCount={LANGUAGE_MULTI_SELECT_INITIAL_VISIBLE}
      name={name}
      options={options.map((option) => ({ value: option.code, label: option.label }))}
      searchHint={searchHint}
      selected={selected}
    />
  );
}
