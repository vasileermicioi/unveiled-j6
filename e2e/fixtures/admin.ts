import { resolve } from "node:path";

import type { Page } from "@playwright/test";

import { waitForPostLogin } from "./auth";
import type { Locale } from "./base";
import { expect } from "./base";

export const SAMPLE_EVENT_IMAGE = resolve(process.cwd(), "e2e/fixtures/sample-event.jpg");

const R2_ENV_KEYS = [
  "S3_ENDPOINT",
  "S3_REGION",
  "S3_BUCKET",
  "S3_ACCESS_KEY_ID",
  "S3_SECRET_ACCESS_KEY",
  "IMAGE_PUBLIC_BASE_URL",
] as const;

/** DE admin form accessible names (HeroUI appends "*" for required fields). */
export const adminLabels = {
  name: "Name*",
  email: "Kontakt-E-Mail*",
  street: "Straße*",
  houseNumber: "Hausnummer*",
  addressLine2: "Adresszusatz (optional)",
  partner: "Partner*",
  title: "Titel*",
  description: "Beschreibung*",
  zipCode: "PLZ*",
  category: "Kategorie*",
  eventType: "Event-Typ*",
  eventDate: /^(datum|date)\*?$/i,
  eventTime: /^(uhrzeit|time)\*?$/i,
  credits: "Credits*",
  capacity: "Kapazität*",
  secretCode: "Secret Code",
  promoCode: "Promo-Code",
  eventWebsite: "Event-Website",
  ticketType: "Ticket-Typ",
  codeMode: "Code-Modus",
  barrierFree: "Barrierefrei",
  languages: /sprachen|languages/i,
  hasSubtitles: /untertitel|subtitles/i,
  subtitleLanguage: /untertitelsprache|subtitle language/i,
} as const;

/** Fill a native date/time field by accessible name (gap G7). */
export async function fillLabeledDateOrTime(
  page: Page,
  label: string | RegExp,
  value: string,
  options?: { nth?: number },
): Promise<void> {
  // Chromium exposes HeroUI TextField date/time inputs as textboxes with the label name.
  const field = page.getByRole("textbox", { name: label }).nth(options?.nth ?? 0);
  await expect(field).toBeVisible({ timeout: 15_000 });
  await field.fill(value);
}

export function uniqueSuffix(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/** Compose display address the same way catalog writes (Berlin release). */
export function composeDisplayAddress(fields: {
  street: string;
  houseNumber: string;
  addressLine2?: string;
  zipCode: string;
}): string {
  const streetLine = `${fields.street.trim()} ${fields.houseNumber.trim()}`;
  const parts = [streetLine];
  const line2 = fields.addressLine2?.trim();
  if (line2) {
    parts.push(line2);
  }
  parts.push(`${fields.zipCode.trim()} Berlin`);
  return parts.join(", ");
}

export async function fillStructuredLocation(
  page: Page,
  fields: {
    street: string;
    houseNumber: string;
    addressLine2?: string;
    zipCode?: string;
  },
): Promise<void> {
  await fillTextbox(page, adminLabels.street, fields.street);
  await fillTextbox(page, adminLabels.houseNumber, fields.houseNumber);
  if (fields.addressLine2 !== undefined) {
    await fillTextbox(page, adminLabels.addressLine2, fields.addressLine2);
  }
  if (fields.zipCode !== undefined) {
    await fillTextbox(page, adminLabels.zipCode, fields.zipCode);
  }
}

/** True when all six R2 / image env vars are non-empty. */
export function r2Configured(): boolean {
  return R2_ENV_KEYS.every((key) => Boolean(process.env[key]?.trim()));
}

export function futureDateISO(daysAhead: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  return date.toISOString().slice(0, 10);
}

export type AdminTab =
  | "overview"
  | "partners"
  | "events"
  | "featured"
  | "featured-partners"
  | "users"
  | "waitlist";

const TAB_HREF: Record<AdminTab, string> = {
  overview: "admin",
  partners: "admin/partners",
  events: "admin/events",
  featured: "admin/featured",
  "featured-partners": "admin/featured-partners",
  users: "admin/users",
  waitlist: "admin/waitlist",
};

/** Admin chrome tab labels after Featured events rename (never bare Featured / Empfohlen). */
export const adminTabLabels = {
  featuredEvents: /^empfohlene events$|^featured events$/i,
  featuredPartners: /^empfohlene partner$|^featured partners$/i,
} as const;

export async function navigateAdminTab(page: Page, locale: Locale, tab: AdminTab): Promise<void> {
  await page.goto(`/${locale}/${TAB_HREF[tab]}`);
  await expect(page.getByRole("main")).toBeVisible({ timeout: 15_000 });
}

/** Native checkbox multi-select: check an option by its accessible name. */
export async function checkOptionByName(page: Page, name: string | RegExp): Promise<void> {
  const checkbox = page.getByRole("checkbox", { name });
  await expect(checkbox).toBeVisible({ timeout: 10_000 });
  await checkbox.check();
}

/** Native `<select>`: resolve by accessible label, pick option by visible text. */
export async function selectOptionByLabel(
  page: Page,
  label: string | RegExp,
  optionName: string | RegExp,
): Promise<void> {
  const select =
    typeof label === "string"
      ? page.getByLabel(label, { exact: true }).first()
      : page.getByLabel(label).first();
  await expect(select).toBeVisible({ timeout: 10_000 });

  if (typeof optionName === "string") {
    await select.selectOption({ label: optionName });
    return;
  }

  const options = select.locator("option");
  const count = await options.count();
  for (let i = 0; i < count; i++) {
    const option = options.nth(i);
    const text = ((await option.textContent()) ?? "").trim();
    if (!optionName.test(text)) {
      continue;
    }
    const value = await option.getAttribute("value");
    if (value != null && value !== "") {
      await select.selectOption(value);
    } else {
      await select.selectOption({ label: text });
    }
    return;
  }

  throw new Error(`No <option> matching ${optionName} for label ${String(label)}`);
}

/** Native `input[type="number"]`: fill by accessible label. */
export async function fillNumberByLabel(
  page: Page,
  label: string | RegExp,
  value: string | number,
): Promise<void> {
  const field =
    typeof label === "string" ? page.getByLabel(label, { exact: true }) : page.getByLabel(label);
  await expect(field).toBeVisible({ timeout: 15_000 });
  const asString = String(value);
  await field.fill("");
  await field.fill(asString);
  await expect(field).toHaveValue(asString, { timeout: 5_000 });
}

export async function fillTextbox(
  page: Page,
  accessibleName: string,
  value: string,
): Promise<void> {
  const field = page.getByRole("textbox", { name: accessibleName, exact: true });
  await expect(field).toBeVisible({ timeout: 15_000 });
  // Client islands can remount once after hydration and wipe an early fill — retry once.
  for (let attempt = 0; attempt < 2; attempt++) {
    await field.click({ timeout: 15_000 });
    await field.fill(value);
    if ((await field.inputValue()) === value) {
      return;
    }
    await page.waitForTimeout(250);
  }
  await expect(field).toHaveValue(value, { timeout: 5_000 });
}

export type CreatedPartner = {
  name: string;
  contactEmail: string;
  street: string;
  houseNumber: string;
  addressLine2?: string;
  zipCode: string;
  /** Composed display address persisted on the partner row. */
  composedAddress: string;
};

export type CreatePartnerOverrides = Partial<Omit<CreatedPartner, "composedAddress">> & {
  logoPath?: string;
  /** When true, do not attach a logo (for required-logo rejection tests). */
  skipLogo?: boolean;
};

export async function createPartnerViaUI(
  page: Page,
  locale: Locale,
  overrides: CreatePartnerOverrides = {},
): Promise<CreatedPartner> {
  const suffix = uniqueSuffix();
  const street = overrides.street ?? `E2E Straße ${suffix}`;
  const houseNumber = overrides.houseNumber ?? "42";
  const zipCode = overrides.zipCode ?? "10115";
  const partner: CreatedPartner = {
    name: overrides.name ?? `E2E Partner ${suffix}`,
    contactEmail: overrides.contactEmail ?? `partner-e2e-${suffix}@example.com`,
    street,
    houseNumber,
    addressLine2: overrides.addressLine2,
    zipCode,
    composedAddress: composeDisplayAddress({
      street,
      houseNumber,
      addressLine2: overrides.addressLine2,
      zipCode,
    }),
  };
  const logoPath = overrides.skipLogo ? undefined : (overrides.logoPath ?? SAMPLE_EVENT_IMAGE);

  await page.goto(`/${locale}/admin/partners/new`);
  await expect(page.getByRole("heading", { name: /partner anlegen|create partner/i })).toBeVisible({
    timeout: 15_000,
  });
  await page.waitForLoadState("networkidle");
  await fillTextbox(page, adminLabels.name, partner.name);
  await fillTextbox(page, adminLabels.email, partner.contactEmail);
  await fillStructuredLocation(page, {
    street: partner.street,
    houseNumber: partner.houseNumber,
    addressLine2: partner.addressLine2 ?? "",
    zipCode: partner.zipCode,
  });
  // Hydration can wipe the first TextField after later fills — re-apply before submit.
  await fillTextbox(page, adminLabels.name, partner.name);
  await fillTextbox(page, adminLabels.email, partner.contactEmail);
  await fillStructuredLocation(page, {
    street: partner.street,
    houseNumber: partner.houseNumber,
    addressLine2: partner.addressLine2 ?? "",
    zipCode: partner.zipCode,
  });

  if (logoPath) {
    // BDD exception: file-input
    await page.locator('input[name="logo"]').setInputFiles(logoPath);
  }

  await page.getByRole("button", { name: /^anlegen$|^create$/i }).click();
  await expect(page).toHaveURL(new RegExp(`/${locale}/admin/partners/?$`), { timeout: 90_000 });
  await expect(page.getByText(partner.name).first()).toBeVisible({ timeout: 15_000 });
  return partner;
}

export async function deletePartnerViaUI(
  page: Page,
  locale: Locale,
  partnerName: string,
): Promise<void> {
  await page.goto(`/${locale}/admin/partners`);
  const row = page.getByRole("row").filter({ hasText: partnerName });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.getByRole("link", { name: /löschen|delete/i }).click();
  await expect(page).toHaveURL(/\/admin\/partners\/.+\/delete/);
  await page.getByRole("button", { name: /^löschen$|^delete$/i }).click();
  await expect(page).toHaveURL(new RegExp(`/${locale}/admin/partners/?$`), { timeout: 30_000 });
  await expect(page.getByText(partnerName)).toHaveCount(0);
}

export type CreatedEvent = {
  title: string;
  partnerName: string;
  eventId: string;
  detailPath: string;
};

export type CreateEventOverrides = {
  title?: string;
  partnerName: string;
  description?: string;
  street?: string;
  houseNumber?: string;
  addressLine2?: string;
  zipCode?: string;
  category?: string | RegExp;
  eventType?: string | RegExp;
  eventDate?: string;
  eventTime?: string;
  creditPrice?: string;
  totalCapacity?: string;
  ticketType?: "SECRET_CODE" | "VOUCHER_PROMO" | "VOUCHER_PDF";
  secretCode?: string;
  eventWebsiteUrl?: string;
  imagePath?: string;
  skipImage?: boolean;
  barrierFree?: "Ja" | "Nein" | "Yes" | "No";
  language?: string | RegExp;
  hasSubtitles?: boolean;
  /** Native select value (allowlisted code, e.g. `EN`). Defaults to `EN` when hasSubtitles. */
  subtitleLanguage?: string;
};

export async function createEventViaUI(
  page: Page,
  locale: Locale,
  overrides: CreateEventOverrides,
): Promise<CreatedEvent> {
  const suffix = uniqueSuffix();
  const title = overrides.title ?? `E2E Event ${suffix}`;
  const imagePath = overrides.skipImage ? undefined : (overrides.imagePath ?? SAMPLE_EVENT_IMAGE);

  await page.goto(`/${locale}/admin/events/new`);
  await expect(page.getByRole("heading", { name: /event anlegen|create event/i })).toBeVisible({
    timeout: 15_000,
  });
  await page.waitForLoadState("networkidle");
  await selectOptionByLabel(page, adminLabels.partner, overrides.partnerName);
  await fillTextbox(page, adminLabels.title, title);
  await fillTextbox(
    page,
    adminLabels.description,
    overrides.description ?? `E2E description ${suffix}`,
  );
  const street = overrides.street ?? `E2E Straße ${suffix}`;
  const houseNumber = overrides.houseNumber ?? "1";
  await fillStructuredLocation(page, {
    street,
    houseNumber,
    addressLine2: overrides.addressLine2 ?? "",
    zipCode: overrides.zipCode ?? "10115",
  });
  await selectOptionByLabel(page, adminLabels.category, overrides.category ?? "Theater");
  await selectOptionByLabel(page, adminLabels.eventType, overrides.eventType ?? "Performance");

  const eventDate = overrides.eventDate ?? futureDateISO(14);
  await fillLabeledDateOrTime(page, adminLabels.eventDate, eventDate);
  if (overrides.eventTime) {
    await fillLabeledDateOrTime(page, adminLabels.eventTime, overrides.eventTime);
  }

  if (overrides.creditPrice) {
    await fillNumberByLabel(page, adminLabels.credits, overrides.creditPrice);
  }
  if (overrides.totalCapacity) {
    await fillNumberByLabel(page, adminLabels.capacity, overrides.totalCapacity);
  }

  if (overrides.ticketType === "VOUCHER_PROMO") {
    await selectOptionByLabel(page, adminLabels.ticketType, /voucher \(promo\)|voucher/i);
    if (overrides.eventWebsiteUrl) {
      await fillTextbox(page, adminLabels.eventWebsite, overrides.eventWebsiteUrl);
    }
  } else if (overrides.ticketType === "VOUCHER_PDF") {
    await selectOptionByLabel(page, adminLabels.ticketType, /voucher \(pdf\)/i);
  } else {
    const code = overrides.secretCode ?? `E2E${suffix.slice(0, 8).toUpperCase()}`;
    const secretField = page.getByRole("textbox", { name: adminLabels.secretCode, exact: true });
    if ((await secretField.count()) > 0) {
      await secretField.fill(code);
    }
  }

  if (overrides.barrierFree) {
    await selectOptionByLabel(page, adminLabels.barrierFree, overrides.barrierFree);
  }
  if (overrides.language) {
    await checkOptionByName(page, overrides.language);
  }
  if (overrides.hasSubtitles) {
    await page.getByRole("checkbox", { name: adminLabels.hasSubtitles }).check();
    const subtitleCode = overrides.subtitleLanguage ?? "EN";
    await selectOptionByLabel(
      page,
      adminLabels.subtitleLanguage,
      subtitleCode === "EN" ? /englisch|english/i : new RegExp(subtitleCode, "i"),
    );
  }

  if (imagePath) {
    // BDD exception: file-input
    await page.locator('input[name="image"]').setInputFiles(imagePath);
  }

  await page.getByRole("button", { name: /^anlegen$|^create$/i }).click();
  await expect(page).toHaveURL(new RegExp(`/${locale}/admin/events/?$`), { timeout: 90_000 });
  await expect(page.getByText(title).first()).toBeVisible({ timeout: 15_000 });

  const row = page.getByRole("row").filter({ hasText: title });
  const editHref = await row.getByRole("link", { name: /bearbeiten|edit/i }).getAttribute("href");
  const eventId = editHref?.match(/\/events\/([^/]+)\/edit/)?.[1];
  if (!eventId) {
    throw new Error(`Could not parse event id from edit href: ${editHref}`);
  }

  return {
    title,
    partnerName: overrides.partnerName,
    eventId,
    detailPath: `/${locale}/events/${eventId}`,
  };
}

export async function deleteEventViaUI(
  page: Page,
  locale: Locale,
  eventTitle: string,
): Promise<void> {
  await page.goto(`/${locale}/admin/events`);
  const row = page.getByRole("row").filter({ hasText: eventTitle });
  await expect(row).toBeVisible({ timeout: 15_000 });
  await row.getByRole("link", { name: /löschen|delete/i }).click();
  await expect(page).toHaveURL(/\/admin\/events\/.+\/delete/);
  await page.getByRole("button", { name: /^löschen$|^delete$/i }).click();
  await expect(page).toHaveURL(new RegExp(`/${locale}/admin/events/?$`), { timeout: 30_000 });
  await expect(page.getByText(eventTitle)).toHaveCount(0);
}

export async function expectEventOnDiscover(
  page: Page,
  locale: Locale,
  eventTitle: string,
  partnerName?: string,
): Promise<void> {
  // Discover shows admin-featured upcoming only — assert via Discover when featured;
  // otherwise fall back to admin catalog (create flows do not auto-feature).
  await page.goto(`/${locale}/discover`);
  const onDiscover = page.getByText(eventTitle);
  if ((await onDiscover.count()) > 0) {
    await expect(onDiscover.first()).toBeVisible({ timeout: 10_000 });
    if (partnerName) {
      await expect(page.getByText(partnerName).first()).toBeVisible();
    }
    return;
  }

  // Fallback: event remains in admin catalog even when not featured.
  await page.goto(`/${locale}/admin/events`);
  await expect(page.getByText(eventTitle).first()).toBeVisible({ timeout: 15_000 });
  if (partnerName) {
    await expect(
      page.getByRole("row").filter({ hasText: eventTitle }).getByText(partnerName).first(),
    ).toBeVisible();
  }
}

export async function expectPublicEventDetail(
  page: Page,
  _locale: Locale,
  event: Pick<CreatedEvent, "title" | "partnerName" | "detailPath">,
): Promise<void> {
  await page.goto(event.detailPath);
  await expect(page.getByRole("heading", { name: event.title })).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText(event.partnerName).first()).toBeVisible();
  await expect(
    page.getByRole("link", { name: /anmelden zum buchen|sign in to book/i }),
  ).toBeVisible();
}

/** After loginAsAdmin — wait until we leave /login (retry once on auth flake). */
export async function settleAdminSession(page: Page, locale: Locale): Promise<void> {
  try {
    await waitForPostLogin(page, locale);
  } catch {
    // Neon Auth / redirect loops under load — one fresh login attempt.
    const { loginAsAdmin } = await import("./auth");
    await page.context().clearCookies();
    await loginAsAdmin(page, locale);
    await waitForPostLogin(page, locale);
  }
}
