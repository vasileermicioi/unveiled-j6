import { expect, test } from "../fixtures/base";

test("Locale root redirect", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/de/);
});
