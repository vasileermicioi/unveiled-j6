import type { Page } from "@playwright/test";

import { signupFreshUser } from "../fixtures/auth";
import { expect, type Locale, test } from "../fixtures/base";
import { getEventIdByTitle, getPartnerIdByName } from "../fixtures/catalog";
import { completeOnboardingWizard } from "../fixtures/onboarding";

/** Mirrors `CONSENT_STORAGE_KEY` in apps/web — keep in sync. */
const CONSENT_STORAGE_KEY = "unveiled:cookie-consent";

/** Stable demo seed titles from `@unveiled/db` DEMO_DISCOVERY_TITLES. */
const TITLES = {
  tonight: "Tonight: Stadt ohne Schlaf",
  pastHidden: "Past Premiere: Archive Night",
  theaterFuture: "Tartuffe — Molière",
  ausstellung: "Exhibition Opening: Material Echoes",
  konzert: "Global Sound Forum",
} as const;

async function setConsent(page: Page, decision: "accepted" | "declined"): Promise<void> {
  await page.addInitScript(
    ({ key, decision: d }) => {
      try {
        localStorage.setItem(
          key,
          JSON.stringify({
            decision: d,
            expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
          }),
        );
      } catch {
        // ignore
      }
    },
    { key: CONSENT_STORAGE_KEY, decision },
  );
}

/**
 * Fresh USER + full onboarding — preferred over E2E_USER_* login, which often
 * stalls on Neon Auth when the seeded password/account drifts.
 * Lands on `/:locale/membership` after the wizard.
 */
async function loginMember(page: Page, locale: Locale): Promise<void> {
  await signupFreshUser(page, locale);
  await completeOnboardingWizard(page, locale);
}

/** Berlin calendar YYYY-MM-DD for `daysFromToday` (can be negative). */
function berlinYmd(daysFromToday: number): string {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const today = formatter.format(new Date());
  const [y, m, d] = today.split("-").map(Number);
  const utc = new Date(Date.UTC(y ?? 0, (m ?? 1) - 1, (d ?? 1) + daysFromToday, 12, 0, 0));
  return formatter.format(utc);
}

async function applyDateRange(page: Page, from: string, to: string): Promise<void> {
  await page.getByLabel(/von|from/i).fill(from);
  await page.getByLabel(/bis|until/i).fill(to);
  await page.getByRole("button", { name: /anwenden|apply/i }).click();
  await expect(page).toHaveURL(/[?&]from=/);
}

/** Bookmark control on a feed that currently shows a single matching event. */
function soleBookmark(page: Page) {
  return page.getByRole("button", { name: /^(merken|gemerkt|save|saved)$/i });
}

async function acceptMapConsent(page: Page): Promise<void> {
  await page.evaluate((key) => {
    const stored = {
      decision: "accepted" as const,
      expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000,
    };
    localStorage.setItem(key, JSON.stringify(stored));
    window.dispatchEvent(new CustomEvent("unveiled:cookie-consent-change", { detail: stored }));
  }, CONSENT_STORAGE_KEY);
}

test.describe("event-discovery.feature", () => {
  // Neon Auth signup can flake under load; one retry keeps the suite green without unmarked skips.
  test.describe.configure({ retries: 1 });

  test("Scenario: Guest can view public event detail without authentication", async ({
    page,
    locale,
  }) => {
    await page.context().clearCookies();
    // Prefer Discover → public detail (no test-process DB). Fall back to seeded id if preview empty.
    await page.goto(`/${locale}`);
    const detailCta = page.getByRole("link", { name: /bin dabei|book now/i }).first();
    if ((await detailCta.count()) > 0) {
      await detailCta.click();
    } else {
      const eventId = await getEventIdByTitle(TITLES.tonight);
      await page.goto(`/${locale}/events/${eventId}`);
    }

    await expect(page).toHaveURL(new RegExp(`/${locale}/events/[^/?#]+`));
    await expect(page).not.toHaveURL(/\/(login|signup)/);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({ timeout: 15_000 });
    // Checkout summary card: total + guest unlock CTA (no auth required to view)
    await expect(page.getByText(/^gesamt$|^total$/i).first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: /einloggen zum freischalten|log in to unlock/i }).first(),
    ).toBeVisible();
  });

  test("Scenario: Guest path to full browse requires signup or login", async ({ page, locale }) => {
    await page.context().clearCookies();
    await page.goto(`/${locale}/events`);

    await expect(page).toHaveURL(new RegExp(`/${locale}/(login|signup)`), { timeout: 15_000 });
    await expect(page).toHaveURL(/returnTo=/);
    expect(decodeURIComponent(page.url())).toMatch(new RegExp(`/${locale}/events`));
  });

  test("Scenario: Default feed shows today's events only", async ({ page, locale }) => {
    await loginMember(page, locale);
    await page.goto(`/${locale}/events`);

    await expect(
      page.getByText(/heute \(europe\/berlin\)|today \(europe\/berlin\)/i),
    ).toBeVisible();
    await expect(page.getByText(TITLES.tonight)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(TITLES.theaterFuture)).toHaveCount(0);
    await expect(page.getByText(TITLES.pastHidden)).toHaveCount(0);
  });

  test("Scenario: Events with invalid or past dates are hidden", async ({ page, locale }) => {
    await loginMember(page, locale);
    await page.goto(`/${locale}/events`);
    await expect(page.getByText(TITLES.pastHidden)).toHaveCount(0);

    const from = berlinYmd(-30);
    const to = berlinYmd(60);
    await applyDateRange(page, from, to);
    await expect(page.getByText(TITLES.pastHidden)).toHaveCount(0);

    await page.goto(`/${locale}/events/map?from=${from}&to=${to}`);
    await expect(page.getByText(TITLES.pastHidden)).toHaveCount(0);
  });

  test("Scenario: Filter by category", async ({ page, locale }) => {
    await loginMember(page, locale);
    const from = berlinYmd(0);
    const to = berlinYmd(30);
    // GET filter form contract (same as selecting category + Apply)
    await page.goto(
      `/${locale}/events?category=Ausstellung&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    );
    await expect(page).toHaveURL(/category=Ausstellung/);

    await expect(page.getByText(TITLES.ausstellung)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(TITLES.tonight)).toHaveCount(0);
    await expect(page.getByText(TITLES.konzert)).toHaveCount(0);
  });

  test("Scenario: Filter by partner (venue)", async ({ page, locale }) => {
    await loginMember(page, locale);
    const from = berlinYmd(0);
    const to = berlinYmd(30);
    const partnerId = await getPartnerIdByName("Gropius Bau");

    // GET filter form contract (same as selecting partner + Apply)
    await page.goto(
      `/${locale}/events?partnerId=${encodeURIComponent(partnerId)}&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    );
    await expect(page).toHaveURL(/partnerId=/);
    await expect(page.getByText(TITLES.ausstellung)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(TITLES.tonight)).toHaveCount(0);
    await expect(page.getByText(TITLES.theaterFuture)).toHaveCount(0);
  });

  test("Scenario: Filter by custom date range", async ({ page, locale }) => {
    await loginMember(page, locale);
    await page.goto(`/${locale}/events`);

    const from = berlinYmd(6);
    const to = berlinYmd(10);
    await applyDateRange(page, from, to);

    await expect(page.getByText(/zeitraum:|range:/i)).toBeVisible();
    await expect(page.getByText(/heute \(europe\/berlin\)|today \(europe\/berlin\)/i)).toHaveCount(
      0,
    );
    await expect(page.getByText(TITLES.theaterFuture)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(TITLES.tonight)).toHaveCount(0);
  });

  test("Scenario: Reset filters", async ({ page, locale }) => {
    await loginMember(page, locale);
    await page.goto(`/${locale}/events`);

    const from = berlinYmd(0);
    const to = berlinYmd(30);
    await applyDateRange(page, from, to);
    await expect(page.getByText(/zeitraum:|range:/i)).toBeVisible();

    await page
      .getByRole("link", { name: /zurücksetzen|reset/i })
      .first()
      .click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/events/?$`));
    await expect(
      page.getByText(/heute \(europe\/berlin\)|today \(europe\/berlin\)/i),
    ).toBeVisible();
  });

  test("Scenario: No results", async ({ page, locale }) => {
    await loginMember(page, locale);
    await page.goto(`/${locale}/events`);

    await applyDateRange(page, "2099-01-01", "2099-01-02");
    await expect(
      page.getByText(/keine events in diesem zeitraum gefunden|no events found for this period/i),
    ).toBeVisible();
  });

  test("Scenario: Map view mirrors the filtered feed", async ({ page, locale }) => {
    await setConsent(page, "accepted");
    await loginMember(page, locale);

    const from = berlinYmd(0);
    const to = berlinYmd(30);
    // GET filters (same contract as the filter form) — preserve query on map link
    await page.goto(
      `/${locale}/events?category=Theater&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
    );
    await expect(page.getByText(TITLES.tonight)).toBeVisible({ timeout: 15_000 });

    await page.getByRole("link", { name: /kartenansicht|map view/i }).click();
    await expect(page).toHaveURL(new RegExp(`/${locale}/events/map`));
    await expect(page).toHaveURL(/category=Theater/);
    await expect(page).toHaveURL(/from=/);

    // Ensure consent is accepted for MapLibre (init script + live update)
    await acceptMapConsent(page);
    const acceptBtn = page.getByRole("button", { name: /akzeptieren|accept/i });
    if ((await acceptBtn.count()) > 0) {
      await acceptBtn.first().click();
    }

    const mapRegion = page.getByRole("region", {
      name: /karte der gefilterten events|map of filtered events/i,
    });
    const consentFallback = page.getByText(
      /karte benötigt cookie-zustimmung|map needs cookie consent/i,
    );
    await expect(mapRegion.or(consentFallback)).toBeVisible({ timeout: 20_000 });

    // Filtered Theater set — list↔map preserves filters; markers on map (titles in popups only)
    const listLink = page.getByRole("link", { name: /listenansicht|list view/i });
    await expect(listLink).toBeVisible();
    await expect(listLink).toHaveAttribute("href", /category=Theater/);
    await expect(page.getByText(TITLES.ausstellung)).toHaveCount(0);
  });

  test("Scenario: Saved events view", async ({ page, locale }) => {
    await loginMember(page, locale);

    // Isolate Tartuffe via date range (not today-only) — single bookmark on the page
    await page.goto(`/${locale}/events`);
    const from = berlinYmd(6);
    const to = berlinYmd(10);
    await applyDateRange(page, from, to);
    await expect(page.getByText(TITLES.theaterFuture)).toBeVisible({ timeout: 15_000 });

    const saveBtn = soleBookmark(page);
    const label = ((await saveBtn.getAttribute("aria-label")) ?? "").toLowerCase();
    if (label === "merken" || label === "save") {
      await saveBtn.click();
      await expect(page.getByRole("main")).toBeVisible({ timeout: 15_000 });
    }

    await page.goto(`/${locale}/saved`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByText(TITLES.theaterFuture)).toBeVisible({ timeout: 15_000 });
    // Not today-only: future theater event is visible on saved even if not "today"
    await expect(page.getByText(/heute \(europe\/berlin\)|today \(europe\/berlin\)/i)).toHaveCount(
      0,
    );
  });

  test("Scenario: Save and unsave an event", async ({ page, locale }) => {
    await loginMember(page, locale);
    await page.goto(`/${locale}/events`);

    await expect(page.getByText(TITLES.tonight)).toBeVisible({ timeout: 15_000 });
    // Default today feed shows a single seeded tonight event → one bookmark
    const bookmark = soleBookmark(page);
    await expect(bookmark).toBeVisible();

    const before = ((await bookmark.getAttribute("aria-label")) ?? "").toLowerCase();
    await bookmark.click();
    await expect(page.getByRole("main")).toBeVisible({ timeout: 15_000 });

    await page.goto(`/${locale}/events`);
    const bookmarkAfter = soleBookmark(page);
    const after = ((await bookmarkAfter.getAttribute("aria-label")) ?? "").toLowerCase();
    expect(after).not.toBe(before);

    await bookmarkAfter.click();
    await expect(page.getByRole("main")).toBeVisible({ timeout: 15_000 });
    await page.goto(`/${locale}/events`);
    const finalLabel = ((await soleBookmark(page).getAttribute("aria-label")) ?? "").toLowerCase();
    expect(finalLabel).toBe(before);
  });

  test("Scenario: Saving requires authentication", async ({ page, locale }) => {
    // Guest cards hide save; unauthenticated POST still redirects to login
    await page.context().clearCookies();
    await page.goto(`/${locale}`);
    await expect(page.getByRole("button", { name: /^(merken|gemerkt|save|saved)$/i })).toHaveCount(
      0,
    );

    await page.evaluate(
      ({ locale: loc, title }) => {
        void title;
        const form = document.createElement("form");
        form.method = "POST";
        // Use a placeholder id — missing event still redirects to login when unauthenticated
        form.action = `/${loc}/events/00000000-0000-4000-8000-000000000099/save`;
        const input = document.createElement("input");
        input.type = "hidden";
        input.name = "returnTo";
        input.value = `/${loc}/events`;
        form.appendChild(input);
        document.body.appendChild(form);
        form.submit();
      },
      { locale, title: TITLES.tonight },
    );

    await page.waitForURL(/\/login/, { timeout: 15_000 });
    await expect(page).toHaveURL(/\/login/);
    await expect(page).toHaveURL(/returnTo|return_to|callback/i);
  });

  test("Scenario: Public discovery preview for guests", async ({ page, locale }) => {
    await page.context().clearCookies();
    await page.goto(`/${locale}`);

    await expect(
      page.getByRole("heading", {
        level: 1,
        name: /aktuelle events in berlin|current events in berlin/i,
      }),
    ).toBeVisible();
    // Membership framing remains in the section eyebrow (hero membership CTAs were dropped).
    await expect(
      page.getByText(/mitgliedschaft buchbar|bookable with your membership/i).first(),
    ).toBeVisible();

    // Preview events (seeded upcoming) — guest CTA is Book Now / Bin dabei → detail (not booking POST)
    const detailCta = page.getByRole("link", { name: /bin dabei|book now/i }).first();
    await expect(detailCta).toBeVisible({ timeout: 15_000 });
    await expect(detailCta).toHaveAttribute("href", new RegExp(`/${locale}/events/[^/?#]+`));

    // Partner venues section
    await expect(page.getByText(/partnerorte|partner venues/i).first()).toBeVisible();

    // Guests do not get a public full feed equivalent to /events on Discover.
    await expect(page).not.toHaveURL(new RegExp(`/${locale}/events/?$`));
  });
});
