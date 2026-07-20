import type { LegalContent, LocalizedContent } from "./types";

const impressumSections = {
  de: [
    {
      id: "provider",
      title: "Anbieter",
      placeholder: "Platzhalter — Impressumstext wird von Rechtsberatung ergänzt.",
    },
    {
      id: "contact",
      title: "Kontakt",
      placeholder: "Platzhalter — Kontaktdaten werden von Rechtsberatung ergänzt.",
    },
    {
      id: "register",
      title: "Registerangaben",
      placeholder: "Platzhalter — Registerangaben werden von Rechtsberatung ergänzt.",
    },
  ],
  en: [
    {
      id: "provider",
      title: "Provider",
      placeholder: "Placeholder — Impressum body copy pending legal review.",
    },
    {
      id: "contact",
      title: "Contact",
      placeholder: "Placeholder — Contact details pending legal review.",
    },
    {
      id: "register",
      title: "Registration details",
      placeholder: "Placeholder — Registration details pending legal review.",
    },
  ],
} as const;

const privacySections = {
  de: [
    {
      id: "overview",
      title: "Datenschutzüberblick",
      placeholder: "Platzhalter — Datenschutztext wird von Rechtsberatung ergänzt.",
    },
    {
      id: "processing",
      title: "Datenverarbeitung",
      placeholder: "Platzhalter — Verarbeitungszwecke werden von Rechtsberatung ergänzt.",
    },
    {
      id: "rights",
      title: "Betroffenenrechte",
      placeholder: "Platzhalter — Rechte der betroffenen Personen werden ergänzt.",
    },
  ],
  en: [
    {
      id: "overview",
      title: "Privacy overview",
      placeholder: "Placeholder — Privacy policy body copy pending legal review.",
    },
    {
      id: "processing",
      title: "Data processing",
      placeholder: "Placeholder — Processing purposes pending legal review.",
    },
    {
      id: "rights",
      title: "Your rights",
      placeholder: "Placeholder — Data subject rights pending legal review.",
    },
  ],
} as const;

const termsSections = {
  de: [
    {
      id: "scope",
      title: "Geltungsbereich",
      placeholder: "Platzhalter — AGB-Text wird von Rechtsberatung ergänzt.",
    },
    {
      id: "membership",
      title: "Mitgliedschaft",
      placeholder: "Platzhalter — Mitgliedschaftsbedingungen werden ergänzt.",
    },
    {
      id: "booking",
      title: "Buchungen",
      placeholder: "Platzhalter — Buchungsbedingungen werden ergänzt.",
    },
  ],
  en: [
    {
      id: "scope",
      title: "Scope",
      placeholder: "Placeholder — Terms body copy pending legal review.",
    },
    {
      id: "membership",
      title: "Membership",
      placeholder: "Placeholder — Membership terms pending legal review.",
    },
    {
      id: "booking",
      title: "Bookings",
      placeholder: "Placeholder — Booking terms pending legal review.",
    },
  ],
} as const;

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
      sections: [...impressumSections.de],
    },
    en: {
      eyebrow: "Legal",
      pageTitle: "Imprint",
      intro: "Legal information pursuant to German law.",
      sections: [...impressumSections.en],
    },
  },
  privacy: {
    de: {
      eyebrow: "Rechtliches",
      pageTitle: "Datenschutz",
      intro: "Informationen zur Verarbeitung personenbezogener Daten.",
      sections: [...privacySections.de],
    },
    en: {
      eyebrow: "Legal",
      pageTitle: "Privacy Policy",
      intro: "Information about the processing of personal data.",
      sections: [...privacySections.en],
    },
  },
  terms: {
    de: {
      eyebrow: "Rechtliches",
      pageTitle: "AGB",
      intro: "Allgemeine Geschäftsbedingungen für die Nutzung von Unveiled Berlin.",
      sections: [...termsSections.de],
    },
    en: {
      eyebrow: "Legal",
      pageTitle: "Terms of Service",
      intro: "General terms and conditions for using Unveiled Berlin.",
      sections: [...termsSections.en],
    },
  },
};
