import type { Story } from "@ladle/react";
import { storyLocale } from "../stories/fixtures";
import { AdminTabNav } from "./AdminTabNav";

export const Overview: Story = () => <AdminTabNav activeTab="overview" locale={storyLocale} />;
Overview.storyName = "AdminTabNav / Overview";

export const Partners: Story = () => <AdminTabNav activeTab="partners" locale={storyLocale} />;
Partners.storyName = "AdminTabNav / Partners";

export const Events: Story = () => <AdminTabNav activeTab="events" locale={storyLocale} />;
Events.storyName = "AdminTabNav / Events";

export const Users: Story = () => <AdminTabNav activeTab="users" locale={storyLocale} />;
Users.storyName = "AdminTabNav / Users";

export const Waitlist: Story = () => <AdminTabNav activeTab="waitlist" locale={storyLocale} />;
Waitlist.storyName = "AdminTabNav / Waitlist";
