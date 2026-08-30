import type { LegalContent, LocalizedContent } from "./types";

/**
 * Three legal pages, each with a few FAQ-style accordion sections.
 * Operator identity on Impressum; Privacy/Terms refer to it.
 */
export const legalContent: {
  impressum: LocalizedContent<LegalContent>;
  privacy: LocalizedContent<LegalContent>;
  terms: LocalizedContent<LegalContent>;
} = {
  impressum: {
    de: {
      eyebrow: "Rechtliches",
      pageTitle: "Impressum",
      intro: "Rechtliche Angaben gemäß TMG.",
      sections: [
        {
          id: "provider",
          title: "Anbieter",
          body: [
            "unveiled GmbH",
            "Vertreten durch Pia Sonnekalb & Sarah Michot",
            "Greifswalder Straße 1",
            "10405 Berlin",
            "Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV: Pia Sonnekalb und Sarah Michot (Anschrift wie oben).",
          ],
        },
        {
          id: "contact",
          title: "Kontakt",
          body: ["Telefon: (+49) 157 878 16 930", "E-Mail: support@unveiled.berlin"],
        },
        {
          id: "notices",
          title: "Haftung und Urheberrecht",
          body: [
            "Die Inhalte dieser Seiten wurden mit Sorgfalt erstellt; für Richtigkeit, Vollständigkeit und Aktualität übernehmen wir keine Gewähr. Für eigene Inhalte sind wir nach den allgemeinen Gesetzen verantwortlich; eine Pflicht zur Überwachung fremder Informationen besteht nicht (§§ 7–10 TMG).",
            "Unsere eigenen Inhalte und Werke unterliegen dem deutschen Urheberrecht. Nutzung außerhalb der gesetzlichen Schranken bedarf unserer Zustimmung.",
          ],
        },
      ],
    },
    en: {
      eyebrow: "Legal",
      pageTitle: "Imprint",
      intro: "Legal information pursuant to German law.",
      sections: [
        {
          id: "provider",
          title: "Operator",
          body: [
            "unveiled GmbH",
            "represented by Pia Sonnekalb & Sarah Michot",
            "Greifswalder Straße 1",
            "10405 Berlin",
            "Responsible for content under German press rules: Pia Sonnekalb and Sarah Michot (address as above).",
          ],
        },
        {
          id: "contact",
          title: "Contact",
          body: ["Phone: (+49) 157 878 16 930", "Email: support@unveiled.berlin"],
        },
        {
          id: "notices",
          title: "Liability and copyright",
          body: [
            "We create site content with care but do not guarantee accuracy, completeness, or currency. We are responsible for our own content under general law and are not required to monitor third-party information (§§ 7–10 TMG).",
            "Our own content and works are subject to German copyright. Use beyond statutory limits needs our consent.",
          ],
        },
      ],
    },
  },
  privacy: {
    de: {
      eyebrow: "Rechtliches",
      pageTitle: "Datenschutz",
      intro: "Informationen zur Verarbeitung personenbezogener Daten.",
      sections: [
        {
          id: "overview",
          title: "Überblick",
          body: [
            "Verantwortliche Stelle und Kontakt: siehe Impressum (support@unveiled.berlin).",
            "Unveiled Berlin ist eine kuratierte Kultur-Mitgliedschaft mit monatlichen Credits für Buchungen bei Partnerveranstaltungen in Berlin.",
          ],
        },
        {
          id: "data",
          title: "Daten und Zwecke",
          body: [
            "Wir verarbeiten Konto- und Sitzungsdaten, optionale Profil-/Präferenzangaben, Mitgliedschafts-, Credit- und Buchungsdaten, Zahlungsmetadaten (Kartendaten nur bei Stripe), Support-Kommunikation sowie technische Logs ohne Personenbezug bzw. PII-frei.",
            "Zwecke und Rechtsgrundlagen (Art. 6 DSGVO): Vertragserfüllung für Konto, Buchungen, Credits und Abonnement (lit. b); Stripe-Zahlungen (lit. b); transaktionale E-Mails (lit. b); Sentry-Fehlerüberwachung PII-frei (lit. f); Karten (MapLibre/OpenStreetMap) nur nach Einwilligung in nicht notwendige Cookies (lit. a); gesetzliche Aufbewahrung z. B. GoBD (lit. c).",
          ],
        },
        {
          id: "processors-rights",
          title: "Empfänger, Cookies und Rechte",
          body: [
            "Empfänger: Neon Auth / Neon Postgres, Stripe Billing, Resend, Cloudflare Workers und R2, Sentry (PII-frei). OpenStreetMap-Kacheln nur nach Cookie-Einwilligung.",
            "Beim ersten Besuch können Sie nicht notwendige Cookies annehmen oder ablehnen; die Event-Karte lädt nur nach Annahme. Sitzung/Auth und PII-freies Sentry sind davon unabhängig.",
            "Speicherung nur so lange wie nötig bzw. gesetzlich vorgeschrieben. Bei Kontolöschung anonymisieren wir personenbezogene Angaben und deaktivieren den Login; anonymisierte Buchungs-/Ledger-Daten können aus handels- und steuerrechtlichen Gründen verbleiben.",
            "Sie haben insbesondere Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch sowie Widerruf erteilter Einwilligungen mit Wirkung für die Zukunft. Beschwerde bei der Berliner Beauftragten für Datenschutz und Informationsfreiheit ist möglich.",
          ],
        },
      ],
    },
    en: {
      eyebrow: "Legal",
      pageTitle: "Privacy Policy",
      intro: "Information about the processing of personal data.",
      sections: [
        {
          id: "overview",
          title: "Overview",
          body: [
            "Controller and contact: see Imprint (support@unveiled.berlin).",
            "Unveiled Berlin is a curated cultural-access membership with monthly credits for bookings at partner venues in Berlin.",
          ],
        },
        {
          id: "data",
          title: "Data and purposes",
          body: [
            "We process account and session data, optional profile/preference data, membership, credit and booking data, payment metadata (card details only at Stripe), support communications, and technical logs that are anonymized or PII-free.",
            "Purposes and legal bases (Art. 6 GDPR): contract performance for account, bookings, credits, and subscription (b); Stripe payments (b); transactional email (b); PII-free Sentry error monitoring (f); maps (MapLibre/OpenStreetMap) only after consent to non-essential cookies (a); legal retention such as GoBD (c).",
          ],
        },
        {
          id: "processors-rights",
          title: "Recipients, cookies, and rights",
          body: [
            "Recipients: Neon Auth / Neon Postgres, Stripe Billing, Resend, Cloudflare Workers and R2, Sentry (PII-free). OpenStreetMap tiles only after cookie consent.",
            "On a first visit you can accept or decline non-essential cookies; the event map loads only after accept. Session/auth and PII-free Sentry are not gated on that choice.",
            "We keep data only as long as needed or legally required. On account deletion we anonymize personal details and disable login; anonymized booking/ledger records may remain for commercial and tax reasons.",
            "You have, in particular, rights of access, rectification, erasure, restriction, portability, and objection, and may withdraw consent with effect for the future. You may also complain to the Berliner Beauftragte für Datenschutz und Informationsfreiheit.",
          ],
        },
      ],
    },
  },
  terms: {
    de: {
      eyebrow: "Rechtliches",
      pageTitle: "AGB",
      intro: "Allgemeine Geschäftsbedingungen für die Nutzung von Unveiled Berlin.",
      sections: [
        {
          id: "membership",
          title: "Geltung und Mitgliedschaft",
          body: [
            "Diese AGB gelten für die Unveiled-Berlin-Plattform und die kuratierte Kultur-Mitgliedschaft (Betreiber: siehe Impressum). Es handelt sich um ein Abonnement mit monatlichen Credits für Partnerveranstaltungen in Berlin — kein Einzel-Ticketshop und kein Multi-City-Angebot.",
            "Mit Abschluss erhalten Sie Zugang und die im Plan enthaltenen Credits für den laufenden Abrechnungszeitraum. Zahlung und Abo-Verwaltung laufen über Stripe Billing bzw. die in der App angebotenen Abrechnungsfunktionen. Es besteht kein Anspruch auf bestimmte Events oder Partner.",
            "Soweit ein gesetzliches Widerrufsrecht für digitale Abonnements gilt, bleiben die gesetzlichen Regeln unberührt.",
          ],
        },
        {
          id: "credits-booking",
          title: "Credits und Buchung",
          body: [
            "Credits dienen nur der Buchung auf Unveiled Berlin; kein Umtausch in Geld, kein Verkauf, keine Übertragung, keine à-la-carte-Pakete.",
            "Nicht genutzte Credits verfallen am Periodenende bzw. bei Verlängerung. Credits werden nicht in den nächsten Zeitraum übertragen und rollen nicht mit. Nach Kündigung verfallen Restcredits am Ende des bezahlten Zeitraums.",
            "Buchungen verbrauchen Credits und setzen buchungsfähigen Status voraus. Eintritt über geheime Codes in der App. Kapazität und Warteliste können gelten; Wartelistenförderung nutzt denselben Buchungsweg. Keine Selbst-Stornierung oder Selbst-Erstattung (Secure RSVP); bei Absage durch den Betreiber können Credits nach Produktregeln gutgeschrieben werden.",
          ],
        },
        {
          id: "end",
          title: "Kündigung, Haftung und Recht",
          body: [
            "Kündigung über Stripe Customer Portal oder in-app Abrechnung. Zugang und Credits bleiben bis zum Ende des bezahlten Zeitraums; danach wird die Mitgliedschaft inaktiv. Wir können bei Zahlungsausfall, AGB-Verstoß oder gesetzlicher Pflicht sperren oder beenden.",
            "Partnerstätten verantworten vor Ort Inhalt und Hausrecht. Für leichte Fahrlässigkeit haften wir nur bei Verletzung wesentlicher Pflichten und begrenzt auf typischen Schaden, soweit zulässig; Vorsatz, grobe Fahrlässigkeit sowie Körper-/Gesundheitsschäden bleiben unberührt.",
            "Es gilt deutsches Recht unter Ausschluss des UN-Kaufrechts, soweit zwingendes Verbraucherschutzrecht nicht entgegensteht. Soweit zulässig: Gerichtsstand Berlin. Wesentliche AGB-Änderungen teilen wir angemessen mit. Support per E-Mail (kein Echtzeit-Chat).",
          ],
        },
      ],
    },
    en: {
      eyebrow: "Legal",
      pageTitle: "Terms of Service",
      intro: "General terms and conditions for using Unveiled Berlin.",
      sections: [
        {
          id: "membership",
          title: "Scope and membership",
          body: [
            "These Terms apply to the Unveiled Berlin platform and curated cultural-access membership (operator: see Imprint). Membership is a subscription with monthly credits for partner events in Berlin — not a one-off ticket shop and not multi-city.",
            "When you subscribe you get platform access and the credits in your plan for the current billing period. Payment and subscription management run through Stripe Billing and in-app billing. There is no entitlement to specific events or partners.",
            "Where a statutory right of withdrawal applies to digital subscriptions, the statutory rules apply.",
          ],
        },
        {
          id: "credits-booking",
          title: "Credits and booking",
          body: [
            "Credits are only for bookings on Unveiled Berlin; no cash exchange, sale, transfer, or à-la-carte packs.",
            "Unused credits expire at the period boundary or renewal. Credits do not roll over to the next period. After cancellation, remaining credits are forfeited at the end of the paid period.",
            "Bookings spend credits and need a booking-eligible status. Admission uses secret codes in the app. Capacity and waitlist may apply; waitlist promotion uses the same booking path. No self-cancel or self-refund (secure RSVP); if we cancel an event, credits may be restored under the product rules.",
          ],
        },
        {
          id: "end",
          title: "Cancellation, liability, and law",
          body: [
            "Cancel via the Stripe Customer Portal or in-app billing. Access and credits continue until the end of the paid period; then membership becomes inactive. We may suspend or end the subscription for failed payment, breach, or legal duty.",
            "Partner venues remain responsible on site. For slight negligence we are liable only for breach of essential duties and limited to typical foreseeable damage where permitted; intent, gross negligence, and injury to life, body, or health remain unaffected.",
            "German law applies, excluding the CISG, unless mandatory consumer rules provide otherwise. Where permitted, venue is Berlin. Material Term changes will be communicated suitably. Support is by email (no real-time chat).",
          ],
        },
      ],
    },
  },
};
