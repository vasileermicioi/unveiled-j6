import { Description, Surface } from "@heroui/react";
import type { Story } from "@ladle/react";
import { getAdminCopy } from "../../lib/admin-content";
import { storyLocale } from "../stories/fixtures";
import { AdminFormNumberField } from "./AdminFormNumberField";

const copy = getAdminCopy(storyLocale);

export const Default: Story = () => (
  <Surface className="flex max-w-md flex-col gap-2" variant="transparent">
    <AdminFormNumberField defaultValue={1} label={copy.creditPriceLabel} name="credit_price" />
    <Description>Native HTML number input with `.admin-native-number`.</Description>
  </Surface>
);
Default.storyName = "AdminFormNumberField / Default (native)";

export const RequiredWithMinMax: Story = () => (
  <Surface className="flex max-w-md flex-col gap-2" variant="transparent">
    <AdminFormNumberField
      defaultValue={10}
      isRequired
      label={copy.capacityLabel}
      maxValue={500}
      minValue={1}
      name="total_capacity"
    />
    <Description>Required capacity field with min 1 / max 500 and default 10.</Description>
  </Surface>
);
RequiredWithMinMax.storyName = "AdminFormNumberField / Required min-max (native)";
