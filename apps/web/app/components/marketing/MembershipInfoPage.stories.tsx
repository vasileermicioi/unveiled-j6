import type { Story } from "@ladle/react";

import { getPageContent } from "../../lib/content";
import { storyLocale } from "../stories/fixtures";
import { MembershipInfoPage } from "./MembershipInfoPage";

const content = getPageContent(storyLocale, "membership");

export const Guest: Story = () => (
  <MembershipInfoPage content={content} locale={storyLocale} view="guest" />
);
Guest.storyName = "MembershipInfoPage / Guest";

export const Checkout: Story = () => (
  <MembershipInfoPage content={content} locale={storyLocale} view="checkout" />
);
Checkout.storyName = "MembershipInfoPage / Checkout";

export const Active: Story = () => (
  <MembershipInfoPage content={content} locale={storyLocale} view="active" />
);
Active.storyName = "MembershipInfoPage / Active";

export const Frozen: Story = () => (
  <MembershipInfoPage content={content} locale={storyLocale} view="frozen" />
);
Frozen.storyName = "MembershipInfoPage / Frozen";

export const CheckoutError: Story = () => (
  <MembershipInfoPage
    content={content}
    errorMessage={content.checkoutError}
    locale={storyLocale}
    view="error"
  />
);
CheckoutError.storyName = "MembershipInfoPage / Error";
