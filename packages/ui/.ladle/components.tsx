import type { GlobalProvider } from "@ladle/react";

import { ThemeDecorator } from "../src/stories/ThemeDecorator";

export const Provider: GlobalProvider = ({ children }) => (
  <ThemeDecorator>{children}</ThemeDecorator>
);
