import type { Locale } from "./locale";

export type BillingCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  planLabel: string;
  planName: string;
  statusLabel: string;
  periodEndLabel: string;
  periodEndUnknown: string;
  paymentMethodLabel: string;
  paymentMethodUnknown: string;
  billingAddressLabel: string;
  billingAddressUnknown: string;
  paymentMethodNames: Record<"CARD" | "PAYPAL" | "SEPA", string>;
  statusNames: Record<"ACTIVE" | "CANCELLED_PENDING" | "INACTIVE" | "PAST_DUE" | "UNPAID", string>;
  portalCta: string;
  cancelCta: string;
  cancelPendingNote: string;
  pastDueTitle: string;
  pastDueBody: string;
  inactiveTitle: string;
  inactiveBody: string;
  inactiveCta: string;
  unpaidTitle: string;
  unpaidBody: string;
  supportEmail: string;
  noSubscriptionBody: string;
  portalMissingCustomer: string;
  portalError: string;
  cancelError: string;
  cancelMissingSubscription: string;
  backToProfile: string;
  backToBilling: string;
  cancelPageTitle: string;
  cancelPageSubtitle: string;
  cancelConfirm: string;
  cancelKeep: string;
  successCancelled: string;
  noRolloverNote: string;
};

const copy: Record<Locale, BillingCopy> = {
  de: {
    eyebrow: "Konto",
    title: "Abrechnung",
    subtitle: "Plan, Zahlung und Kündigung verwalten.",
    planLabel: "Plan",
    planName: "Basic Berlin",
    statusLabel: "Status",
    periodEndLabel: "Aktuelle Periode endet",
    periodEndUnknown: "Nicht verfügbar",
    paymentMethodLabel: "Zahlungsmethode",
    paymentMethodUnknown: "Im Stripe-Portal aktualisieren",
    billingAddressLabel: "Rechnungsadresse",
    billingAddressUnknown: "Im Stripe-Portal aktualisieren",
    paymentMethodNames: {
      CARD: "Karte",
      PAYPAL: "PayPal",
      SEPA: "SEPA",
    },
    statusNames: {
      ACTIVE: "Aktiv",
      CANCELLED_PENDING: "Kündigung zum Periodenende",
      INACTIVE: "Inaktiv",
      PAST_DUE: "Zahlung überfällig",
      UNPAID: "Gesperrt",
    },
    portalCta: "Zahlung & Adresse aktualisieren",
    cancelCta: "Abo kündigen",
    cancelPendingNote: "Dein Abo endet zum Periodenende. Credits bleiben bis dahin nutzbar.",
    pastDueTitle: "Zahlung fehlgeschlagen",
    pastDueBody: "Credits sind eingefroren. Aktualisiere deine Zahlungsmethode im Stripe-Portal.",
    inactiveTitle: "Kein aktives Abo",
    inactiveBody: "Reaktiviere Basic Berlin über den Membership-Checkout.",
    inactiveCta: "Membership öffnen",
    unpaidTitle: "Zahlung gestoppt",
    unpaidBody: "Dein Konto ist gesperrt. Schreib an",
    supportEmail: "support@unveiled.berlin",
    noSubscriptionBody: "Noch kein Abonnement. Starte über Membership.",
    portalMissingCustomer: "Kein Stripe-Kunde verknüpft. Bitte zuerst Membership abschließen.",
    portalError: "Stripe-Portal konnte nicht geöffnet werden. Bitte später erneut versuchen.",
    cancelError: "Kündigung fehlgeschlagen. Bitte später erneut versuchen.",
    cancelMissingSubscription: "Kein kündbares Stripe-Abo gefunden.",
    backToProfile: "Zurück zum Konto",
    backToBilling: "Zurück zur Abrechnung",
    cancelPageTitle: "Abo kündigen?",
    cancelPageSubtitle:
      "Die Kündigung gilt zum Ende der aktuellen Periode. Bis dahin bleiben Credits und Buchungen verfügbar. Credits verfallen am Periodenende (kein Übertrag).",
    cancelConfirm: "Zum Periodenende kündigen",
    cancelKeep: "Abo behalten",
    successCancelled: "Kündigung zum Periodenende vorgemerkt.",
    noRolloverNote: "Ungenutzte Credits verfallen am Periodenende — kein Übertrag.",
  },
  en: {
    eyebrow: "Account",
    title: "Billing",
    subtitle: "Manage plan, payment, and cancellation.",
    planLabel: "Plan",
    planName: "Basic Berlin",
    statusLabel: "Status",
    periodEndLabel: "Current period ends",
    periodEndUnknown: "Not available",
    paymentMethodLabel: "Payment method",
    paymentMethodUnknown: "Update in Stripe portal",
    billingAddressLabel: "Billing address",
    billingAddressUnknown: "Update in Stripe portal",
    paymentMethodNames: {
      CARD: "Card",
      PAYPAL: "PayPal",
      SEPA: "SEPA",
    },
    statusNames: {
      ACTIVE: "Active",
      CANCELLED_PENDING: "Cancels at period end",
      INACTIVE: "Inactive",
      PAST_DUE: "Past due",
      UNPAID: "Frozen",
    },
    portalCta: "Update payment & address",
    cancelCta: "Cancel subscription",
    cancelPendingNote: "Your subscription ends at the period end. Credits stay usable until then.",
    pastDueTitle: "Payment failed",
    pastDueBody: "Credits are frozen. Update your payment method in the Stripe portal.",
    inactiveTitle: "No active subscription",
    inactiveBody: "Reactivate Basic Berlin via membership checkout.",
    inactiveCta: "Open membership",
    unpaidTitle: "Payment stopped",
    unpaidBody: "Your account is frozen. Contact",
    supportEmail: "support@unveiled.berlin",
    noSubscriptionBody: "No subscription yet. Start via membership.",
    portalMissingCustomer: "No Stripe customer linked. Complete membership checkout first.",
    portalError: "Could not open the Stripe portal. Please try again later.",
    cancelError: "Cancellation failed. Please try again later.",
    cancelMissingSubscription: "No cancellable Stripe subscription found.",
    backToProfile: "Back to account",
    backToBilling: "Back to billing",
    cancelPageTitle: "Cancel subscription?",
    cancelPageSubtitle:
      "Cancellation takes effect at the end of the current period. Credits and booking access remain until then. Unused credits expire at period end (no rollover).",
    cancelConfirm: "Cancel at period end",
    cancelKeep: "Keep subscription",
    successCancelled: "Cancellation scheduled for period end.",
    noRolloverNote: "Unused credits expire at period end — no rollover.",
  },
};

export function getBillingCopy(locale: Locale): BillingCopy {
  return copy[locale];
}
