import type { Page } from "@playwright/test";
import { createDb, eq, events, listPartners, subscriptions, users } from "@unveiled/db";

import { adminLabels } from "./admin";
import { getAdminCredentials, loginAsAdmin, logout } from "./auth";
import type { Locale } from "./base";
import { expect } from "./base";
import { requireDatabaseUrl } from "./billing";

/** Demo seed title — remainingCapacity forced to 0 in seed.ts */
export const SOLD_OUT_WAITLIST_TITLE = "Sold Out: Waitlist Demo Night";

export function hasAdminCredentials(): boolean {
  return Boolean(process.env.E2E_ADMIN_EMAIL?.trim() && process.env.E2E_ADMIN_PASSWORD?.trim());
}

/**
 * Resolve sold-out waitlist demo event. If the catalog was seeded before Phase 7,
 * insert the demo event (reusing an existing partner + image) so e2e can proceed
 * without `seed:demo --reset`.
 */
export async function getSoldOutWaitlistEventId(): Promise<string> {
  const db = createDb(requireDatabaseUrl());
  const existing = await db.query.events.findFirst({
    where: eq(events.title, SOLD_OUT_WAITLIST_TITLE),
  });
  if (existing) {
    return existing.id;
  }

  const template = await db.query.events.findFirst();
  if (!template) {
    throw new Error("No events in catalog — run bun run seed:demo");
  }

  const partners = await listPartners(db, { limit: 1 });
  const partner = partners[0];
  if (!partner) {
    throw new Error("No partners in catalog — run bun run seed:demo");
  }

  const dateTime = new Date();
  dateTime.setDate(dateTime.getDate() + 12);
  dateTime.setHours(20, 0, 0, 0);

  const [created] = await db
    .insert(events)
    .values({
      partnerId: partner.id,
      partnerName: partner.name,
      title: SOLD_OUT_WAITLIST_TITLE,
      description:
        "Seed sold-out event for waitlist demos — join waitlist, then raise capacity in admin edit to auto-promote.",
      address: partner.address || "Berlin",
      neighborhood: template.neighborhood || "Mitte",
      imageId: template.imageId,
      category: template.category || "Theater",
      eventType: template.eventType || "Performance",
      tags: ["waitlist", "sold-out", "demo"],
      dateTime,
      timingMode: template.timingMode,
      startTimeMinutes: template.startTimeMinutes,
      weekday: dateTime.getDay(),
      creditPrice: 2,
      totalCapacity: 20,
      remainingCapacity: 0,
      ticketType: "SECRET_CODE",
      secretCodeMode: "MANUAL",
      secretCode: "WAITLIST26",
      languages: ["de", "en"],
      barrierFree: true,
      lat: template.lat,
      lng: template.lng,
      mapZoom: template.mapZoom,
    })
    .returning();

  if (!created) {
    throw new Error("Failed to insert sold-out waitlist demo event");
  }
  return created.id;
}

/** Ensure demo event is sold out before join flows (promotion tests bump capacity). */
export async function forceEventSoldOut(eventId: string): Promise<void> {
  const db = createDb(requireDatabaseUrl());
  await db
    .update(events)
    .set({ remainingCapacity: 0, updatedAt: new Date() })
    .where(eq(events.id, eventId));
}

export async function getEventCapacity(
  eventId: string,
): Promise<{ totalCapacity: number; remainingCapacity: number }> {
  const db = createDb(requireDatabaseUrl());
  const row = await db.query.events.findFirst({
    where: eq(events.id, eventId),
  });
  if (!row) {
    throw new Error(`Event not found: ${eventId}`);
  }
  return {
    totalCapacity: row.totalCapacity,
    remainingCapacity: row.remainingCapacity,
  };
}

/**
 * Raise total capacity via admin edit so remaining increases and
 * `processWaitlistForEvent` runs (Phase 7 promotion trigger).
 */
export async function bumpEventCapacityViaAdmin(
  page: Page,
  locale: Locale,
  eventId: string,
  increaseBy = 1,
): Promise<void> {
  const { totalCapacity } = await getEventCapacity(eventId);
  const target = String(totalCapacity + increaseBy);

  await loginAsAdmin(page, locale, getAdminCredentials());
  await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 30_000 });

  await page.goto(`/${locale}/admin/events/${eventId}/edit`);
  await expect(page.getByRole("heading", { name: /event bearbeiten|edit event/i })).toBeVisible({
    timeout: 20_000,
  });
  await page.waitForLoadState("networkidle");

  const capacity = page.getByRole("textbox", { name: adminLabels.capacity, exact: true });
  await expect(capacity).toBeVisible({ timeout: 15_000 });
  const current = Number((await capacity.inputValue()) || "0");
  const delta = Number(target) - current;
  if (delta !== 0) {
    const buttons = page.getByRole("button", {
      name: delta > 0 ? /erhöhen|increment|increase/i : /verringern|decrement|decrease/i,
    });
    const btn = buttons.nth(1);
    for (let i = 0; i < Math.abs(delta); i++) {
      await btn.click();
    }
  }

  await page.keyboard.press("Escape").catch(() => undefined);
  await page.getByRole("button", { name: /^speichern$|^save$/i }).click();
  await expect(page).toHaveURL(new RegExp(`/${locale}/admin/events/?$`), { timeout: 60_000 });

  await logout(page, locale);
}

/** Attach Stripe ids so portal CTA / cancel confirm page are shown (not live Stripe objects). */
export async function setStripeBillingIds(
  email: string,
  ids: { customerId: string; subscriptionId: string },
): Promise<void> {
  const db = createDb(requireDatabaseUrl());
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (!user) {
    throw new Error(`User not found: ${email}`);
  }
  const existing = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.userId, user.id),
  });
  const periodEnd = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
  if (!existing) {
    await db.insert(subscriptions).values({
      userId: user.id,
      status: "ACTIVE",
      plan: "BASIC_BERLIN",
      stripeCustomerId: ids.customerId,
      stripeSubscriptionId: ids.subscriptionId,
      paymentMethod: "CARD",
      billingAddress: "Berlin",
      periodEnd,
    });
    return;
  }
  await db
    .update(subscriptions)
    .set({
      stripeCustomerId: ids.customerId,
      stripeSubscriptionId: ids.subscriptionId,
      paymentMethod: existing.paymentMethod ?? "CARD",
      billingAddress: existing.billingAddress ?? "Berlin",
      periodEnd: existing.periodEnd ?? periodEnd,
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.userId, user.id));
}

export async function setSubscriptionPeriodEnd(email: string, periodEnd: Date): Promise<void> {
  const db = createDb(requireDatabaseUrl());
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });
  if (!user) {
    throw new Error(`User not found: ${email}`);
  }
  await db
    .update(subscriptions)
    .set({ periodEnd, updatedAt: new Date() })
    .where(eq(subscriptions.userId, user.id));
}
