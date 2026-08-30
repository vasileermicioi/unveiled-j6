import type { FaqContent, LocalizedContent } from "./types";

export const faqContent: LocalizedContent<FaqContent> = {
  de: {
    hero: {
      eyebrow: "Support",
      headline: "Häufig gestellte Fragen",
      subheadline: "Alles Wichtige zu Mitgliedschaft, Credits, Buchung und Storno an einem Ort.",
    },
    section: {
      eyebrow: "HILFE & SUPPORT",
      headline: "Häufig gestellte Fragen.",
      supportEmail: "support@unveiled.berlin",
      items: [
        {
          question: "Wie funktioniert die unveiled Mitgliedschaft?",
          answer:
            "Jeden Monat erhältst du Credits für kulturelle Erlebnisse in ganz Berlin. Nutze sie, um mit der unveiled Community Erfahrungen zu teilen oder die Stadt auf eigene Faust zu entdecken — von Museen und Ausstellungen über Theater und Konzerte bis mehr. Buche einfach über unveiled, dein Ticket ist in der Mitgliedschaft enthalten.",
        },
        {
          question: "Wofür kann ich meine Credits nutzen?",
          answer:
            "Deine Credits schalten kulturelle Erlebnisse in ganz Berlin frei — ob mit der Community oder allein. Nimm an einem unserer Community Experiences teil und entdeckt gemeinsam Kultur, oder nutze deine Credits, um unsere Partner-Venues zu besuchen, wann immer du Lust auf einen Solo-Besuch hast. Und wir fangen gerade erst an: Jede Woche kommen neue Kulturpartner und Erlebnisse hinzu.",
        },
        {
          question: "Wie viele Credits kostet ein Erlebnis?",
          answer:
            "Das hängt vom Erlebnis ab. Die benötigte Anzahl an Credits kann je nach regulärem Ticketpreis, Nachfrage, Zeitpunkt und dem jeweiligen Partner variieren. Den genauen Credit-Preis siehst du immer vor der Buchung. Nach der Buchung ändert sich der Credit-Preis deiner bestätigten Buchung nicht.",
        },
        {
          question: "Was passiert mit ungenutzten Credits?",
          answer:
            "Keine Sorge, ungenutzte Credits verschwinden nicht am Ende des Monats. Sie werden in den nächsten Monat übertragen, sodass du dir bis zu 2 Monatskontingente ansparen kannst.",
        },
        {
          question: "Kann ich ein gebuchtes Erlebnis stornieren?",
          answer:
            "Da wir gerade erst starten, schreib uns einfach kurz eine E-Mail an support@unveiled.berlin — mindestens 12 h vor Beginn des Events. Wir finden immer eine gute Lösung für dich.",
        },
        {
          question: "Was passiert, wenn ich zu spät storniere oder nicht erscheine?",
          answer:
            "Wenn du nach Ablauf der Stornofrist stornierst oder das Erlebnis nicht besuchst, können die für die Buchung verwendeten Credits verfallen und werden nicht erstattet.",
        },
        {
          question: "Was passiert, wenn ein Event abgesagt wird?",
          answer:
            "Wenn ein Erlebnis abgesagt wird und du Anspruch auf eine Erstattung hast, werden dir die Credits der Buchung auf deinem unveiled-Konto gutgeschrieben.",
        },
        {
          question: "Was passiert, wenn ein Event verschoben wird?",
          answer:
            "Wenn ein Erlebnis auf einen neuen Termin verschoben wird, kannst du entweder am neuen Termin teilnehmen oder die Buchung stornieren und deine Credits zurückerhalten. Falls wir dich um eine Entscheidung bitten, hast du drei Tage Zeit. Reagierst du in dieser Frist nicht, werden deine Credits automatisch deinem Konto gutgeschrieben.",
        },
        {
          question: "Kann ich meine Mitgliedschaft jederzeit kündigen?",
          answer:
            "Ja. Du kannst deine Mitgliedschaft jederzeit kündigen. Deine Mitgliedschaft bleibt bis zum Ende des aktuellen bezahlten Abrechnungszeitraums aktiv. Eine zusätzliche Kündigungsfrist gibt es nicht.",
        },
        {
          question: "Kann ich mein unveiled-Konto mit anderen teilen?",
          answer:
            "Nein. Dein Konto ist persönlich und darf nicht mit einer anderen Person geteilt oder von ihr genutzt werden. Jede Person darf nur ein Konto erstellen.",
        },
        {
          question: "Wer organisiert eigentlich die kulturellen Erlebnisse?",
          answer:
            "Die auf unveiled verfügbaren Erlebnisse werden von unseren Kulturpartnern organisiert und durchgeführt. unveiled hilft dir, sie zu entdecken und zu buchen, aber wir sind nicht Veranstalter der einzelnen Events. Daher können auch die Regeln und Bedingungen der Venues gelten.",
        },
      ],
    },
  },
  en: {
    hero: {
      eyebrow: "Support",
      headline: "FAQ",
      subheadline:
        "Everything important about membership, credits, booking, and cancellation in one place.",
    },
    section: {
      eyebrow: "FAQ & SUPPORT",
      headline: "Everything you need to know.",
      supportEmail: "support@unveiled.berlin",
      items: [
        {
          question: "How does the unveiled membership work?",
          answer:
            "Every month, you receive Credits to spend on cultural experiences across Berlin. Use them to join experiences with the unveiled community or explore on your own, from museums and exhibitions to theatre, concerts and more. Simply book through unveiled and your ticket is included in your membership.",
        },
        {
          question: "What can I use my Credits for?",
          answer:
            "Your Credits unlock cultural experiences across Berlin, whether you want to experience them with the community or on your own. Join one of our Community Experiences and discover culture together, or use your Credits to visit our partner venues whenever you feel like going solo. And we’re just getting started. New cultural partners and experiences are added every week.",
        },
        {
          question: "How many Credits does an experience cost?",
          answer:
            "It depends on the experience. The number of Credits required can vary based on factors such as the regular ticket price, demand, timing and the individual partner. You’ll always see the exact Credit price before booking. Once you’ve booked, the Credit price of your confirmed booking won’t change.",
        },
        {
          question: "What happens to unused Credits?",
          answer:
            "Don’t worry, unused Credits don’t disappear at the end of the month. They roll over to the next month, so you can save up to 2 months’ worth of Credits.",
        },
        {
          question: "Can I cancel an experience I booked?",
          answer:
            "Since we’re just getting started, just send us a quick email at support@unveiled.berlin at least 12h before the event starts. We’ll always do our best to find a good solution for you.",
        },
        {
          question: "What happens if I cancel too late or don’t show up?",
          answer:
            "If you cancel after the cancellation deadline or don’t attend the experience, the Credits used for the booking may be forfeited and won’t be refunded.",
        },
        {
          question: "What happens if an event is cancelled?",
          answer:
            "If an experience is cancelled and you are entitled to a refund, the Credits you used for the booking will be returned to your unveiled account.",
        },
        {
          question: "What happens if an event is rescheduled?",
          answer:
            "If an experience is moved to a new date, you can either attend on the new date or cancel the booking and receive your Credits back. If we ask you to make a choice, you’ll have three days to do so. If you don’t respond within that time, your Credits will automatically be returned to your account.",
        },
        {
          question: "Can I cancel my membership anytime?",
          answer:
            "Yes. You can cancel your membership at any time. Your membership will remain active until the end of your current paid billing period. There is no additional notice period.",
        },
        {
          question: "Can I share my unveiled account with someone else?",
          answer:
            "No. Your account is personal and may not be shared with or used by another person. Each person may only create one account.",
        },
        {
          question: "Who actually organises the cultural experiences?",
          answer:
            "The experiences available on unveiled are organised and operated by our cultural partners. unveiled helps you discover and book them, but we are not the organiser of the individual events. The venue’s own rules and conditions may therefore also apply.",
        },
      ],
    },
  },
};
