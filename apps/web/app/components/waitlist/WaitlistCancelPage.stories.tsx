import type { Story } from "@ladle/react";

import { getWaitlistCancelCopy } from "../../lib/waitlist-content";
import { mockSoldOutEvent, storyLocale } from "../stories/fixtures";
import { WaitlistCancelPage } from "./WaitlistCancelPage";

const copy = getWaitlistCancelCopy(storyLocale);
const entryId = "00000000-0000-4000-8000-000000000020";

export const Confirm: Story = () => (
  <WaitlistCancelPage
    copy={copy}
    entryId={entryId}
    eventId={mockSoldOutEvent.id}
    eventTitle={mockSoldOutEvent.title}
    locale={storyLocale}
    view="confirm"
  />
);
Confirm.storyName = "WaitlistCancelPage / Confirm";

export const Success: Story = () => (
  <WaitlistCancelPage
    copy={copy}
    entryId={entryId}
    eventId={mockSoldOutEvent.id}
    eventTitle={mockSoldOutEvent.title}
    locale={storyLocale}
    view="success"
  />
);
Success.storyName = "WaitlistCancelPage / Success";
