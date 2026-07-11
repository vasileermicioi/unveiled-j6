import { Surface } from "@heroui/react";
import type { Story } from "@ladle/react";

import { Logo } from "./Logo";

export const Black: Story = () => <Logo className="text-4xl" tone="black" />;
Black.storyName = "Logo / Black";

export const White: Story = () => (
  <Surface className="flex items-center justify-center p-6" variant="default">
    <Surface className="bg-brand-dark p-6" variant="transparent">
      <Logo className="text-4xl" tone="white" />
    </Surface>
  </Surface>
);
White.storyName = "Logo / White";

export const Yellow: Story = () => (
  <Surface className="bg-brand-dark p-6" variant="transparent">
    <Logo className="text-4xl" tone="yellow" />
  </Surface>
);
Yellow.storyName = "Logo / Yellow";
