import { Surface } from "@heroui/react";
import { SSRProvider } from "@react-aria/ssr";
import type { ReactNode } from "react";

import "../../../apps/web/app/styles/globals.css";

type ThemeDecoratorProps = {
  children: ReactNode;
};

export function ThemeDecorator({ children }: ThemeDecoratorProps) {
  return (
    <SSRProvider>
      <Surface className="min-h-screen bg-brand-yellow p-6" variant="transparent">
        {children}
      </Surface>
    </SSRProvider>
  );
}
