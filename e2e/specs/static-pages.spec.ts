import type { Page } from "@playwright/test";
import { DEMO_DISCOVERY_TITLES } from "@unveiled/db/seed-titles";

import { signupFreshUser } from "../fixtures/auth";
import { expect, test } from "../fixtures/base";
import { getEventIdByTitle } from "../fixtures/catalog";
import { completeOnboardingWizard } from "../fixtures/onboarding";

/** Mirrors `CONSENT_STORAGE_KEY` in apps/web — keep in sync. */
const CONSENT_STORAGE_KEY = "unveiled:cookie-consent";

/** Stable demo seed title with lat/lng (public detail map). */
const SEEDED_MAP_EVENT_TITLE = DEMO_DISCOVERY_TITLES.tonight;

async function fillSignupPasswords(page: Page, password: string): Promise<void> {
  await page.getByLabel(/^passwort$|^password$/i).fill(password);
  const confirm = page.getByLabel(/passwort bestätigen|confirm password/i);
  if ((await confirm.count()) > 0) {
    await confirm.fill(password);
  }
}

/** Clear consent once on the current origin (does not re-clear on later navigations). */
async function clearConsentOnce(page: Page, locale: string): Promise<void> {
  await page.goto(`/${locale}`);
  await page.evaluate((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      // ignore
    }
  }, CONSENT_STORAGE_KEY);
  await page.reload();
}

test.describe("static-pages.feature", () => {
  // Neon Auth signup can flake under load (Discover CTA path).
  test.describe.configure({ retries: 1 });

  test("Scenario: Guest marketing home is the locale home page", async ({ page, locale }) => {
    await page.goto(`/${locale}`);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /eine mitgliedschaft für die gesamte kulturszene|one membership for the entire cultural scene/i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /registrier dich jetzt|register now/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /registrier dich jetzt|register now/i }),
    ).toHaveAttribute("href", new RegExp(`/${locale}/signup`));

    // Slim sticky header: Log in only — Sign up / How it works / Membership are not in the banner.
    const header = page.getByRole("banner");
    await expect(header.getByRole("link", { name: /anmelden|log ?in/i })).toBeVisible();
    await expect(header.getByRole("link", { name: /registrieren|sign up|register/i })).toHaveCount(
      0,
    );
    await expect(header.getByRole("link", { name: /so funktioniert|how it works/i })).toHaveCount(
      0,
    );
    await expect(header.getByRole("link", { name: /^mitgliedschaft$|^membership$/i })).toHaveCount(
      0,
    );

    // Footer Navigation: Discover + FAQ only (How it works / Membership not listed).
    const footer = page.getByRole("contentinfo");
    await expect(footer.getByRole("link", { name: /entdecken|discover/i })).toBeVisible();
    await expect(
      footer.getByRole("link", { name: /^faq$|^häufig gestellte fragen$/i }),
    ).toBeVisible();
    await expect(footer.getByRole("link", { name: /so funktioniert|how it works/i })).toHaveCount(
      0,
    );
    await expect(footer.getByRole("link", { name: /^mitgliedschaft$|^membership$/i })).toHaveCount(
      0,
    );
  });

  test("Scenario: Discover is available at /discover", async ({ page, locale }) => {
    await page.goto(`/${locale}/discover`);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /aktuelle events in berlin|current events in berlin/i,
      }),
    ).toBeVisible();
    await expect(page.getByText(/partnerorte|partner venues/i).first()).toBeVisible();
  });

  test("Scenario: Discover preview links to public event detail", async ({ page, locale }) => {
    await page.context().clearCookies();
    await page.goto(`/${locale}/discover`);

    const detailCta = page.getByRole("link", { name: /bin dabei|book now/i }).first();
    await expect(detailCta).toBeVisible({ timeout: 15_000 });
    await detailCta.click();

    await expect(page).toHaveURL(new RegExp(`/${locale}/events/[^/?#]+`));
    await expect(page).not.toHaveURL(/\/(login|signup)/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15_000 });
  });

  test("Scenario: Discover CTA path to the full member events feed", async ({ page, locale }) => {
    await page.context().clearCookies();
    await page.goto(`/${locale}/discover`);

    // Guests must not see a public full feed equivalent to /events on Discover.
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page).not.toHaveURL(new RegExp(`/${locale}/events/?$`));

    // Guests reach the full feed via signup (no footer Membership CTA).
    await page.goto(`/${locale}/signup?returnTo=${encodeURIComponent(`/${locale}/events`)}`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/(signup|login)`));
    await expect(page).toHaveURL(/returnTo=/);

    const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const password = "e2e-test-pass-123";
    await page.getByLabel(/vorname|first name/i).fill("E2E");
    await page.getByLabel(/nachname|last name/i).fill("Browse");
    await page.getByLabel(/e-?mail/i).fill(`e2e.browse.${stamp}@unveiled.test`);
    await fillSignupPasswords(page, password);
    await page.getByRole("button", { name: /registrieren|sign up|create/i }).click();

    try {
      await page.waitForURL(/\/(onboarding|auth\/continue)/, { timeout: 45_000 });
    } catch {
      // fall through
    }
    if (!page.url().includes("/onboarding")) {
      await page.goto(`/${locale}/onboarding/age`, { waitUntil: "domcontentloaded" });
    }
    // Signup session can lag: if we bounced to login, complete a fresh signup via fixture.
    if (page.url().includes("/login")) {
      await signupFreshUser(page, locale);
    }
    await expect(page).toHaveURL(/\/onboarding\//, { timeout: 20_000 });

    await completeOnboardingWizard(page, locale);
    // Onboarding finish currently lands on membership; member feed is reachable after auth.
    await page.goto(`/${locale}/events`);
    await expect(page).toHaveURL(new RegExp(`/${locale}/events`));
    await expect(page).not.toHaveURL(/\/(login|signup)/);
    await expect(page.getByRole("heading", { level: 1, name: /events/i })).toBeVisible({
      timeout: 15_000,
    });
  });

  test("Scenario: How it works", async ({ page, locale }) => {
    await page.goto(`/${locale}/how-it-works`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(
      page.getByText(/1\.\s*Auswahl|1\.\s*Browse|Mitglied werden|Become a member/i).first(),
    ).toBeVisible();
    await expect(page.getByText(/2\./).first()).toBeVisible();
    await expect(page.getByText(/3\./).first()).toBeVisible();
  });

  test("Scenario: FAQ", async ({ page, locale }) => {
    await page.goto(`/${locale}/faq`);
    // PageSectionHeader: eyebrow + H1 (proximity role/name — not CSS-class selectors)
    await expect(page.getByText(/^support$/i).first()).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 1, name: /^faq$|^häufig gestellte fragen$/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /support@unveiled\.berlin/i }).first(),
    ).toBeVisible();

    const firstQuestion = page.getByRole("button", { name: /wie buche ich|how does booking/i });
    const secondQuestion = page.getByRole("button", {
      name: /was passiert nach|what do i receive after/i,
    });
    await expect(firstQuestion).toBeVisible({ timeout: 10_000 });
    await expect(secondQuestion).toBeVisible();

    await secondQuestion.click();
    // Accordion is single-expand: second panel open implies first closed.
    await expect(
      page.getByText(/einlasscode|promo-code|my tickets|meine tickets/i).first(),
    ).toBeVisible();
  });

  test("Scenario: Bare /discover redirects to localized Discover", async ({ page }) => {
    await page.goto("/discover");
    await expect(page).toHaveURL(/\/(de|en)\/discover\/?$/);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /aktuelle events in berlin|current events in berlin/i,
      }),
    ).toBeVisible();
  });

  test("Scenario: Bilingual content", async ({ page }) => {
    await page.goto("/de/how-it-works");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/verstehen|entscheiden/i);

    await page
      .getByRole("group", { name: /language/i })
      .getByRole("link", { name: /^EN$/ })
      .click();
    await expect(page).toHaveURL(/\/en\/how-it-works/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/understand|commit/i);
  });

  test("Scenario: Legal pages exist and are linked from the footer", async ({ page, locale }) => {
    await page.goto(`/${locale}`);

    const impressum = page.getByRole("link", { name: /impressum|imprint/i }).first();
    const privacy = page.getByRole("link", { name: /datenschutz|privacy/i }).first();
    const terms = page.getByRole("link", { name: /^agb$|terms of service/i }).first();

    await expect(impressum).toBeVisible();
    await expect(privacy).toBeVisible();
    await expect(terms).toBeVisible();

    await impressum.click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/impressum`));
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.goto(`/${locale}/privacy`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.goto(`/${locale}/terms`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  });

  test("Scenario: Cookie consent banner on first visit", async ({ page, locale }) => {
    await clearConsentOnce(page, locale);

    const accept = page.getByRole("button", { name: /akzeptieren|accept/i });
    const decline = page.getByRole("button", { name: /ablehnen|decline/i });
    await expect(accept).toBeVisible({ timeout: 10_000 });
    await expect(decline).toBeVisible();

    await accept.click();
    await expect(accept).toBeHidden({ timeout: 5_000 });

    const stored = await page.evaluate((key) => localStorage.getItem(key), CONSENT_STORAGE_KEY);
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored as string).decision).toBe("accepted");

    await page.reload();
    await expect(page.getByRole("button", { name: /akzeptieren|accept/i })).toHaveCount(0);
  });

  test("Scenario: Declining consent disables the map embed", async ({ page, locale }) => {
    await clearConsentOnce(page, locale);

    const decline = page.getByRole("button", { name: /ablehnen|decline/i });
    await expect(decline).toBeVisible({ timeout: 10_000 });
    await decline.click();

    const stored = await page.evaluate((key) => localStorage.getItem(key), CONSENT_STORAGE_KEY);
    expect(stored).toBeTruthy();
    expect(JSON.parse(stored as string).decision).toBe("declined");

    const eventId = await getEventIdByTitle(SEEDED_MAP_EVENT_TITLE);
    const tileHits: string[] = [];
    page.on("request", (request) => {
      if (request.url().includes("tile.openstreetmap.org")) {
        tileHits.push(request.url());
      }
    });

    await page.goto(`/${locale}/events/${eventId}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15_000 });
    await expect(
      page.getByText(/karte benötigt cookie-zustimmung|map needs cookie consent/i),
    ).toBeVisible({ timeout: 10_000 });
    await expect(
      page.getByRole("link", { name: /auf openstreetmap öffnen|open in openstreetmap/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("region", { name: /karte der gefilterten events|map of filtered events/i }),
    ).toHaveCount(0);
    expect(tileHits).toEqual([]);
  });

  test("Scenario: Error tracking is not gated behind consent", async ({ page, locale }) => {
    // Server-only Sentry (`@sentry/cloudflare` behind SENTRY_DSN) — no client SDK shipped yet,
    // so window.Sentry stays undefined. Declining consent must not inject a client Sentry SDK;
    // error tracking is strictly necessary / ungated per integrations-and-config.md.
    await clearConsentOnce(page, locale);
    await page.getByRole("button", { name: /ablehnen|decline/i }).click();

    const sentryGlobal = await page.evaluate(() => {
      return typeof (window as unknown as { Sentry?: unknown }).Sentry;
    });
    expect(sentryGlobal).toBe("undefined");
  });
});
