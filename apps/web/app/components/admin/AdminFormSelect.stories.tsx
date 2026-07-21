import { Description, Surface } from "@heroui/react";
import type { Story } from "@ladle/react";
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
    <Description>Native HTML select with `.admin-native-select`.</Description>
  </Surface>
);
Single.storyName = "AdminFormSelect / Single (native)";

export const Multiple: Story = () => (
  <Surface className="flex max-w-md flex-col gap-2" variant="transparent">
    <AdminFormSelect
      defaultSelectedKeys={["de", "en"]}
      label={copy.languagesLabel}
      name="languages"
      options={[
        { id: "de", label: "Deutsch" },
        { id: "en", label: "English" },
        { id: "fr", label: "Français" },
      ]}
      selectionMode="multiple"
    />
    <Description>
      Native HTML select multiple (Ctrl/Cmd-click). Posts repeated field names for SSR parsers.
    </Description>
  </Surface>
);
Multiple.storyName = "AdminFormSelect / Multiple (native)";
