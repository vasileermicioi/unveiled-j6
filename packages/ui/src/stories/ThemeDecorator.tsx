import { Surface } from "@heroui/react";
import type { ReactNode } from "react";

import "../../../../apps/web/app/styles/globals.css";

type ThemeDecoratorProps = {
  children: ReactNode;
};

export function ThemeDecorator({ children }: ThemeDecoratorProps) {
  return (
    <Surface className="min-h-screen bg-brand-yellow p-6" variant="transparent">
      {children}
    </Surface>
  );
}
