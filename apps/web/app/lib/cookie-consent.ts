/** MapLibre GL JS + OpenStreetMap map island reads `getStoredConsent()` before tile requests. */
import type { Locale } from "./locale";

export type ConsentDecision = "accepted" | "declined";

export type StoredConsent = {
  decision: ConsentDecision;
  expiresAt: number;
};

export const CONSENT_STORAGE_KEY = "unveiled:cookie-consent";

/** Same-tab listeners (e.g. EventMap) can react when the banner stores a decision. */
export const CONSENT_CHANGE_EVENT = "unveiled:cookie-consent-change";

const CONSENT_TTL_MS = 365 * 24 * 60 * 60 * 1000;

export const CONSENT_COPY = {
  de: {
    message:
      "Wir verwenden Cookies für nicht wesentliche Funktionen wie Karten. Du kannst zustimmen oder ablehnen.",
    accept: "Akzeptieren",
    decline: "Ablehnen",
    privacyLabel: "Datenschutz",
  },
  en: {
    message: "We use cookies for non-essential features such as maps. You can accept or decline.",
    accept: "Accept",
    decline: "Decline",
    privacyLabel: "Privacy",
  },
} as const satisfies Record<
  Locale,
  { message: string; accept: string; decline: string; privacyLabel: string }
>;

function isStoredConsent(value: unknown): value is StoredConsent {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as StoredConsent;
  return (
    (record.decision === "accepted" || record.decision === "declined") &&
    typeof record.expiresAt === "number"
  );
}

export function getStoredConsent(): StoredConsent | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isStoredConsent(parsed)) {
      localStorage.removeItem(CONSENT_STORAGE_KEY);
      return null;
    }

    if (parsed.expiresAt < Date.now()) {
      localStorage.removeItem(CONSENT_STORAGE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function setStoredConsent(decision: ConsentDecision): void {
  if (typeof window === "undefined") {
    return;
  }

  const stored: StoredConsent = {
    decision,
    expiresAt: Date.now() + CONSENT_TTL_MS,
  };

  localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(stored));
  window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT, { detail: stored }));
}

export function hasValidConsent(): boolean {
  return getStoredConsent() !== null;
}

export function hasAcceptedConsent(): boolean {
  return getStoredConsent()?.decision === "accepted";
}
