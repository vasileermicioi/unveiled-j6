import { test as base } from "@playwright/test";

export type Locale = "de" | "en";

type UnveiledFixtures = {
  locale: Locale;
};

export const test = base.extend<UnveiledFixtures>({
  locale: ["de", { option: true }],
});

export { expect } from "@playwright/test";
