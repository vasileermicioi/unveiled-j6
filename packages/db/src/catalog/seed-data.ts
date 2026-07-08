import { WIKIMEDIA_SEED_IMAGES } from "./commons-urls";
import type { CreateEventInput } from "./events";
import type { CreatePartnerInput } from "./partners";

/**
 * Demo catalog seed — real Berlin cultural venues with Wikimedia Commons images (CC/public domain).
 * Refresh image filenames via `bun scripts/resolve-commons-images.ts "<search query>"`.
 */
export type DemoCatalogEntry = {
  partner: Omit<CreatePartnerInput, "logoUpload">;
  events: Omit<CreateEventInput, "partnerId" | "imageUpload">[];
};

function daysFromNow(days: number, hour = 19, minute = 30): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hour, minute, 0, 0);
  return date;
}

export const DEMO_CATALOG: DemoCatalogEntry[] = [
  {
    partner: {
      name: "Volksbühne Berlin",
      address: "Rosa-Luxemburg-Platz, 10178 Berlin",
      contactEmail: "kontakt@volksbuehne.berlin",
      logoUrl: WIKIMEDIA_SEED_IMAGES.volksbuehneFacade.url,
    },
    events: [
      {
        title: "Premiere: Stadt ohne Schlaf",
        description:
          "A new ensemble work blending spoken word, live electronics, and movement — Volksbühne's signature politically charged stage language.",
        address: "Rosa-Luxemburg-Platz, 10178 Berlin",
        neighborhood: "Mitte",
        category: "Theater",
        eventType: "Performance",
        tags: ["premiere", "ensemble"],
        dateTime: daysFromNow(5, 20, 0),
        creditPrice: 2,
        secretCode: "VOLKS2026",
        languages: ["de", "en"],
        barrierFree: true,
        imageUrl: WIKIMEDIA_SEED_IMAGES.volksbuehnePlatz.url,
      },
    ],
  },
  {
    partner: {
      name: "Deutsches Theater",
      address: "Schumannstraße 13A, 10117 Berlin",
      contactEmail: "info@deutschestheater.de",
      logoUrl: WIKIMEDIA_SEED_IMAGES.deutschesTheaterFacade.url,
    },
    events: [
      {
        title: "Tartuffe — Molière",
        description:
          "A sharp, contemporary take on Molière's classic — hypocrisy, devotion, and household intrigue on one of Berlin's grandest stages.",
        address: "Schumannstraße 13A, 10117 Berlin",
        neighborhood: "Mitte",
        category: "Theater",
        eventType: "Performance",
        tags: ["classic", "comedy"],
        dateTime: daysFromNow(8, 19, 30),
        creditPrice: 2,
        secretCode: "TARTUFFE",
        languages: ["de"],
        barrierFree: true,
        imageUrl: WIKIMEDIA_SEED_IMAGES.deutschesTheaterTartuffe.url,
      },
    ],
  },
  {
    partner: {
      name: "Schaubühne am Lehniner Platz",
      address: "Kurfürstendamm 153, 10709 Berlin",
      contactEmail: "service@schaubuehne.de",
      logoUrl: WIKIMEDIA_SEED_IMAGES.schaubuehne.url,
    },
    events: [
      {
        title: "International Ensemble Night",
        description:
          "Three short works from Schaubühne's resident directors — bold staging, multilingual cast, and post-show conversation.",
        address: "Kurfürstendamm 153, 10709 Berlin",
        neighborhood: "Charlottenburg",
        category: "Theater",
        eventType: "Performance",
        tags: ["ensemble", "international"],
        dateTime: daysFromNow(11, 20, 0),
        creditPrice: 2,
        secretCode: "SCHAUB26",
        languages: ["de", "en"],
        barrierFree: false,
        imageUrl: WIKIMEDIA_SEED_IMAGES.schaubuehne.url,
      },
    ],
  },
  {
    partner: {
      name: "Gropius Bau",
      address: "Niederkirchnerstraße 7, 10963 Berlin",
      contactEmail: "info@berlinerfestspiele.de",
      logoUrl: WIKIMEDIA_SEED_IMAGES.gropiusBauFacade.url,
    },
    events: [
      {
        title: "Exhibition Opening: Material Echoes",
        description:
          "Opening night for a cross-disciplinary show of sculpture, sound, and archival photography in the Gropius Bau atrium.",
        address: "Niederkirchnerstraße 7, 10963 Berlin",
        neighborhood: "Kreuzberg",
        category: "Visual Art",
        eventType: "Exhibition",
        tags: ["opening", "contemporary"],
        dateTime: daysFromNow(14, 18, 0),
        creditPrice: 1,
        secretCode: "GROPIUS",
        languages: ["de", "en"],
        barrierFree: true,
        imageUrl: WIKIMEDIA_SEED_IMAGES.gropiusBauWall.url,
      },
    ],
  },
  {
    partner: {
      name: "Haus der Kulturen der Welt",
      address: "John-Foster-Dulles-Allee 10, 10557 Berlin",
      contactEmail: "info@hkw.de",
      logoUrl: WIKIMEDIA_SEED_IMAGES.hkwDay.url,
    },
    events: [
      {
        title: "Global Sound Forum",
        description:
          "An evening of experimental music and talks bridging electronic producers from Berlin and the Global South — HKW's curved hall.",
        address: "John-Foster-Dulles-Allee 10, 10557 Berlin",
        neighborhood: "Tiergarten",
        category: "Music",
        eventType: "Concert",
        tags: ["electronic", "talk"],
        dateTime: daysFromNow(17, 20, 30),
        creditPrice: 2,
        secretCode: "HKWBERLIN",
        languages: ["de", "en"],
        barrierFree: true,
        imageUrl: WIKIMEDIA_SEED_IMAGES.hkwBlueHour.url,
      },
    ],
  },
  {
    partner: {
      name: "Konzerthaus Berlin",
      address: "Gendarmenmarkt 2, 10117 Berlin",
      contactEmail: "info@konzerthaus.de",
      logoUrl: WIKIMEDIA_SEED_IMAGES.konzerthausNight.url,
    },
    events: [
      {
        title: "Chamber Orchestra: Beethoven & Contemporary",
        description:
          "The Konzerthausorchester performs Beethoven's Seventh alongside a new commission — grand hall acoustics at Gendarmenmarkt.",
        address: "Gendarmenmarkt 2, 10117 Berlin",
        neighborhood: "Mitte",
        category: "Music",
        eventType: "Concert",
        tags: ["orchestra", "classical"],
        dateTime: daysFromNow(21, 19, 0),
        creditPrice: 2,
        secretCode: "KONZERT26",
        languages: ["de"],
        barrierFree: true,
        imageUrl: WIKIMEDIA_SEED_IMAGES.konzerthausInterior.url,
      },
    ],
  },
];

/** @deprecated Use DEMO_CATALOG — kept for tests referencing partner list length. */
export const DEMO_PARTNERS: Omit<CreatePartnerInput, "logoUpload">[] = DEMO_CATALOG.map(
  (entry) => entry.partner,
);

/** @deprecated Use DEMO_CATALOG — builds one event for backward-compatible tests. */
export function buildDemoEvents(partnerId: string): CreateEventInput[] {
  const template = DEMO_CATALOG[0]?.events[0];
  if (!template) {
    return [];
  }

  return [{ ...template, partnerId }];
}
