import { Description, Label, Surface } from "@heroui/react";
import type { Story } from "@ladle/react";
import CheckboxMultiSelect from "../../islands/CheckboxMultiSelect";
import { getAdminCopy } from "../../lib/admin-content";
import { storyLocale } from "../stories/fixtures";
import { AdminFormSelect } from "./AdminFormSelect";

const copy = getAdminCopy(storyLocale);

export const Single: Story = () => (
  <Surface className="flex max-w-md flex-col gap-2" variant="transparent">
    <AdminFormSelect
      defaultSelectedKey="music"
      label={copy.categoryLabel}
      name="category"
      options={[
        { id: "music", label: "Music" },
        { id: "theatre", label: "Theatre" },
        { id: "art", label: "Art" },
      ]}
      placeholder={copy.selectPlaceholder}
    />
    <Description>Native HTML select with `.admin-native-select` (single-value only).</Description>
  </Surface>
);
Single.storyName = "AdminFormSelect / Single (native)";

/** Multi-value admin fields use CheckboxMultiSelect — not AdminFormSelect. */
export const MultiValueCheckbox: Story = () => (
  <Surface className="flex max-w-md flex-col gap-2" variant="transparent">
    <Label>{copy.languagesLabel}</Label>
    <CheckboxMultiSelect
      enableSearch
      filterPlaceholder={copy.languagesSearchPlaceholder}
      initialVisibleCount={2}
      name="languages"
      options={[
        { value: "de", label: "Deutsch" },
        { value: "en", label: "English" },
        { value: "fr", label: "Français" },
      ]}
      searchHint={copy.languagesSearchHint}
      selected={["de", "en"]}
    />
    <Description>
      Prefer `CheckboxMultiSelect` for multi-value allowlists. See design-system Form controls.
    </Description>
  </Surface>
);
MultiValueCheckbox.storyName = "CheckboxMultiSelect / Languages (replaces select multiple)";
