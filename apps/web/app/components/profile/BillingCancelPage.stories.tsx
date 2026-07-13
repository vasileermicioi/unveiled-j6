import type { Story } from "@ladle/react";

import { getBillingCopy } from "../../lib/billing-content";
import { storyLocale } from "../stories/fixtures";
import { BillingCancelPage } from "./BillingCancelPage";

const copy = getBillingCopy(storyLocale);

export const Confirm: Story = () => <BillingCancelPage copy={copy} locale={storyLocale} />;
Confirm.storyName = "BillingCancelPage / Confirm";
