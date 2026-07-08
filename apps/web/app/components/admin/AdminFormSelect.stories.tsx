import type { Story } from "@ladle/react";
import { getAdminCopy } from "../../lib/admin-content";
import { storyLocale } from "../stories/fixtures";
import { AdminFormSelect } from "./AdminFormSelect";

const copy = getAdminCopy(storyLocale);

export const Single: Story = () => (
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
);
Single.storyName = "AdminFormSelect / Single";

export const Multiple: Story = () => (
  <AdminFormSelect
    defaultSelectedKeys={["de", "en"]}
    label={copy.languagesLabel}
    name="languages"
    options={[
      { id: "de", label: "Deutsch" },
      { id: "en", label: "English" },
    ]}
    selectionMode="multiple"
  />
);
Multiple.storyName = "AdminFormSelect / Multiple";
