import { Surface } from "@heroui/react";
import type { Story } from "@ladle/react";

import { Logo } from "./Logo";

export const Black: Story = () => <Logo className="text-4xl" tone="black" />;
Black.storyName = "Logo / Black";

export const White: Story = () => (
  <Surface className="rounded border-2 border-foreground bg-foreground p-6" variant="transparent">
    <Logo className="text-4xl" tone="white" />
  </Surface>
);
White.storyName = "Logo / White";

export const Yellow: Story = () => (
  <Surface className="rounded border-2 border-foreground bg-brand-yellow p-6" variant="transparent">
    <Logo className="text-4xl" tone="yellow" />
  </Surface>
);
Yellow.storyName = "Logo / Yellow";
