import type { Story } from "@ladle/react";

import { getGdprMemberCopy } from "../../lib/gdpr-content";
import { storyLocale } from "../stories/fixtures";
import { DeleteAccountPage } from "./DeleteAccountPage";

const copy = getGdprMemberCopy(storyLocale);

export const Confirm: Story = () => <DeleteAccountPage copy={copy} locale={storyLocale} />;
Confirm.storyName = "DeleteAccountPage / Confirm";

export const WithError: Story = () => (
  <DeleteAccountPage copy={copy} error={copy.errorGeneric} locale={storyLocale} />
);
WithError.storyName = "DeleteAccountPage / With error";
