import type { LandingContent, LocalizedContent } from "./types";

export const landingContent: LocalizedContent<LandingContent> = {
  de: {
    headline: "Unveiled Berlin",
    subheadline: "Deine Mitgliedschaft für Theater, Kino, Ausstellungen und neue Leute in Berlin.",
    ctaDiscover: "Entdecken",
    ctaHowItWorks: "So funktioniert's",
    trustMicrocopy: "Live synchronisiert mit den aktuellen Events in Berlin",
    trustBadges: ["Member-owned", "Verified Events", "Berlin Focused"],
  },
  en: {
    headline: "Unveiled Berlin",
    subheadline: "Your membership for theatre, cinema, exhibitions, and new people in Berlin.",
    ctaDiscover: "Discover",
    ctaHowItWorks: "How it works",
    trustMicrocopy: "Live synced with current events in Berlin",
    trustBadges: ["Member-owned", "Verified Events", "Berlin Focused"],
  },
};
