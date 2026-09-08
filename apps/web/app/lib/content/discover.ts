import type { DiscoverContent, LocalizedContent } from "./types";

export const discoverContent: LocalizedContent<DiscoverContent> = {
  de: {
    hero: {
      eyebrow: "Das kannst du aktuell mit unveiled erleben",
      headline: "Berlin entdecken, wie du es willst.",
      subheadline:
        "Deine Mitgliedschaft für Theater, Kino, Ausstellungen und neue Leute in Berlin.",
      ctaMembership: "Mitgliedschaft ansehen",
      ctaBrowseEvents: "Live Erlebnisse ansehen",
      stats: {
        liveFeed: {
          label: "Live im Feed",
          suffix: "kommende Erlebnisse",
        },
        partnerVenues: {
          label: "Partnerorte",
          suffix: "aktive Häuser",
        },
        membership: {
          label: "Mitgliedschaft",
          body: "Alles, was du brauchst, um Berlin zu entdecken.",
        },
      },
    },
    valueProps: [
      {
        title: "Finde Dinge, die zu dir passen",
        body: "Theater, Kino, Ausstellungen und Erlebnisse in Berlin, die man sonst leicht verpasst.",
      },
      {
        title: "Buche spontan mit deinen Credits",
        body: "Mit deiner Mitgliedschaft kannst du jederzeit flexibel buchen, worauf du gerade Lust hast.",
      },
      {
        title: "Werde Teil der unveiled Community",
        body: "Triff Leute, die genauso Lust haben, Neues zu entdecken wie du.",
      },
    ],
    livePreview: {
      eyebrow: "Mit deiner Mitgliedschaft buchbar",
      headline: "Aktuelle Erlebnisse in Berlin.",
      emptyState: "Aktuell keine empfohlenen Erlebnisse.",
    },
    categories: {
      eyebrow: "Mitgliedschaft",
      headline: "Was du mit unveiled entdecken kannst",
      subtext: "Mit deiner Mitgliedschaft entdeckst du Dinge in Berlin, die zu dir passen.",
      items: ["Kino", "Ausstellungen", "Theater", "Museen", "Konzerte", "Besondere Orte"],
      callout: {
        title: "Fehlt dein Lieblingsort?",
        body: "Dein Lieblingskino, Theater oder Museum fehlt noch?",
        cta: "Schreib uns",
        email: "support@unveiled.berlin",
      },
    },
    partners: {
      eyebrow: "Partnerorte",
    },
  },
  en: {
    hero: {
      eyebrow: "This is what you can currently access with unveiled",
      headline: "Discover Berlin the way you want.",
      subheadline: "Your membership for theatre, cinema, exhibitions, and new people in Berlin.",
      ctaMembership: "View membership",
      ctaBrowseEvents: "Explore live experiences",
      stats: {
        liveFeed: {
          label: "Live in the feed",
          suffix: "upcoming experiences",
        },
        partnerVenues: {
          label: "Partner venues",
          suffix: "active venues",
        },
        membership: {
          label: "Membership",
          body: "Everything you need to discover Berlin.",
        },
      },
    },
    valueProps: [
      {
        title: "Find things that fit you",
        body: "Theatre, cinema, exhibitions, and experiences in Berlin that are easy to miss otherwise.",
      },
      {
        title: "Book spontaneously with your credits",
        body: "With your membership, you can book flexibly whenever something feels right.",
      },
      {
        title: "Become part of the unveiled community",
        body: "Meet people who are just as eager to discover something new as you are.",
      },
    ],
    livePreview: {
      eyebrow: "Bookable with your membership",
      headline: "Current experiences in Berlin.",
      emptyState: "No featured experiences right now.",
    },
    categories: {
      eyebrow: "Memberships",
      headline: "What you can discover with unveiled",
      subtext: "With your membership, you discover things in Berlin that match your interests.",
      items: ["Cinema", "Exhibitions", "Theatre", "Museums", "Concerts", "Special venues"],
      callout: {
        title: "Missing your favorite venue?",
        body: "If your favorite cinema, theatre, or museum is missing...",
        cta: "Write to us",
        email: "support@unveiled.berlin",
      },
    },
    partners: {
      eyebrow: "Partner venues",
    },
  },
};
