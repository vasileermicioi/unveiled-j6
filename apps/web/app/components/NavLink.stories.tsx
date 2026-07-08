import type { Story } from "@ladle/react";

import { NavLink } from "./NavLink";

export const Active: Story = () => <NavLink href="/de/discover" isActive label="Entdecken" />;
Active.storyName = "NavLink / Active";

export const Inactive: Story = () => <NavLink href="/de/faq" isActive={false} label="FAQ" />;
Inactive.storyName = "NavLink / Inactive";
