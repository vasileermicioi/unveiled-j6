import type { Story } from "@ladle/react";

import { getWaitlistJoinCopy } from "../../lib/waitlist-content";
import { mockSoldOutEvent, storyLocale } from "../stories/fixtures";
import { WaitlistJoinPage } from "./WaitlistJoinPage";

const copy = getWaitlistJoinCopy(storyLocale);
const entryId = "00000000-0000-4000-8000-000000000020";

export const Form: Story = () => (
  <WaitlistJoinPage
    copy={copy}
    defaultTickets="1"
    event={mockSoldOutEvent}
    locale={storyLocale}
    view="form"
  />
);
Form.storyName = "WaitlistJoinPage / Form";

export const StatusCreated: Story = () => (
  <WaitlistJoinPage
    copy={copy}
    created
    entryId={entryId}
    event={mockSoldOutEvent}
    locale={storyLocale}
    queuePosition={1}
    requestedQty={1}
    view="status"
  />
);
StatusCreated.storyName = "WaitlistJoinPage / Status created";

export const StatusExisting: Story = () => (
  <WaitlistJoinPage
    copy={copy}
    created={false}
    entryId={entryId}
    event={mockSoldOutEvent}
    locale={storyLocale}
    queuePosition={2}
    requestedQty={2}
    view="status"
  />
);
StatusExisting.storyName = "WaitlistJoinPage / Status existing";
