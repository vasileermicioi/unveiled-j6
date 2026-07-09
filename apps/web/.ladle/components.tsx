import { Surface } from "@heroui/react";
import type { GlobalProvider } from "@ladle/react";

import "../app/styles/globals.css";

export const Provider: GlobalProvider = ({ children }) => (
  <Surface className="min-h-screen bg-brand-yellow p-6" variant="transparent">
    {children}
  </Surface>
);
