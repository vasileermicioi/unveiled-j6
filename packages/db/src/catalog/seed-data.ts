import { WIKIMEDIA_SEED_IMAGES } from "./commons-urls";
import { berlinInclusiveDateRange, getBerlinCalendarDate } from "./datetime";
import type { CreateEventInput } from "./events";
import type { CreatePartnerInput } from "./partners";

/**
 * Demo catalog seed — real Berlin cultural venues with Wikimedia Commons images (CC/public domain).
 * Refresh image filenames via `bun scripts/resolve-commons-images.ts "<search query>"`.
 *
 * Discovery E2E titles (stable `getByText` anchors):
 * - Today (Berlin, evening): `Tonight: Stadt ohne Schlaf`
 * - Past (hidden from feed/map): `Past Premiere: Archive Night`
 * - Future Theater: `Tartuffe — Molière`, `International Ensemble Night`
 * - Future Ausstellung: `Exhibition Opening: Material Echoes`
 * - Future Konzert: `Global Sound Forum`, `Chamber Orchestra: Beethoven & Contemporary`
 */
export type DemoCatalogEntry = {
  partner: Omit<CreatePartnerInput, "logoUpload">;
  events: Omit<CreateEventInput, "partnerId" | "imageUpload">[];
};

const YMD_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

function addCalendarDays(ymd: string, days: number): string {
  const match = YMD_RE.exec(ymd);
  if (!match) {
    throw new Error(`Invalid calendar date: ${ymd}`);
  }
  const year = Number.parseInt(match[1] ?? "0", 10);
  const month = Number.parseInt(match[2] ?? "0", 10);
  const day = Number.parseInt(match[3] ?? "0", 10);
  const next = new Date(Date.UTC(year, month - 1, day + days, 12, 0, 0));
  return `${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
}

/** Instant at `hour`:`minute` on the Europe/Berlin calendar day `ymd`. */
function berlinAt(ymd: string, hour: number, minute = 0): Date {
  const { start } = berlinInclusiveDateRange(ymd, ymd);
  return new Date(start.getTime() + hour * 3_600_000 + minute * 60_000);
}

function berlinDaysFromToday(days: number, hour = 19, minute = 30): Date {
  const today = getBerlinCalendarDate(new Date());
  return berlinAt(addCalendarDays(today, days), hour, minute);
}

/**
 * Tonight in Berlin at 22:00 — late enough that daytime CI/dev runs still see it as
 * "not already started" on the default today feed.
 */
function berlinTonight(): Date {
  const today = getBerlinCalendarDate(new Date());
  return berlinAt(today, 22, 0);
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
        title: "Tonight: Stadt ohne Schlaf",
        description:
          "A new ensemble work blending spoken word, live electronics, and movement — Volksbühne's signature politically charged stage language.",
        address: "Rosa-Luxemburg-Platz, 10178 Berlin",
        neighborhood: "Mitte",
        category: "Theater",
        eventType: "Performance",
        tags: ["premiere", "ensemble", "tonight"],
        dateTime: berlinTonight(),
        creditPrice: 2,
        secretCode: "VOLKS2026",
        languages: ["de", "en"],
        barrierFree: true,
        lat: "52.526500",
        lng: "13.412000",
        imageUrl: WIKIMEDIA_SEED_IMAGES.volksbuehnePlatz.url,
      },
      {
        title: "Past Premiere: Archive Night",
        description:
          "Seed-only past event — must never appear on the member feed or map (invalid/past dates are hidden).",
        address: "Rosa-Luxemburg-Platz, 10178 Berlin",
        neighborhood: "Mitte",
        category: "Theater",
        eventType: "Performance",
        tags: ["past", "archive"],
        dateTime: berlinDaysFromToday(-5, 20, 0),
        creditPrice: 2,
        secretCode: "VOLKSPAST",
        languages: ["de"],
        barrierFree: true,
        lat: "52.526500",
        lng: "13.412000",
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
        dateTime: berlinDaysFromToday(8, 19, 30),
        creditPrice: 2,
        secretCode: "TARTUFFE",
        languages: ["de"],
        barrierFree: true,
        lat: "52.524800",
        lng: "13.382500",
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
        dateTime: berlinDaysFromToday(11, 20, 0),
        creditPrice: 2,
        secretCode: "SCHAUB26",
        languages: ["de", "en"],
        barrierFree: false,
        lat: "52.498900",
        lng: "13.302800",
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
        category: "Ausstellung",
        eventType: "Other",
        tags: ["opening", "contemporary"],
        dateTime: berlinDaysFromToday(14, 18, 0),
        creditPrice: 1,
        secretCode: "GROPIUS",
        languages: ["de", "en"],
        barrierFree: true,
        lat: "52.506300",
        lng: "13.376500",
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
        category: "Konzert",
        eventType: "Concert",
        tags: ["electronic", "talk"],
        dateTime: berlinDaysFromToday(17, 20, 30),
        creditPrice: 2,
        secretCode: "HKWBERLIN",
        languages: ["de", "en"],
        barrierFree: true,
        lat: "52.518600",
        lng: "13.348900",
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
        category: "Konzert",
        eventType: "Concert",
        tags: ["orchestra", "classical"],
        dateTime: berlinDaysFromToday(21, 19, 0),
        creditPrice: 2,
        secretCode: "KONZERT26",
        languages: ["de"],
        barrierFree: true,
        lat: "52.513800",
        lng: "13.392000",
        imageUrl: WIKIMEDIA_SEED_IMAGES.konzerthausInterior.url,
      },
    ],
  },
];

/** Stable titles for discovery E2E / DEPLOYMENT docs. */
export const DEMO_DISCOVERY_TITLES = {
  tonight: "Tonight: Stadt ohne Schlaf",
  pastHidden: "Past Premiere: Archive Night",
  theaterFuture: "Tartuffe — Molière",
  ausstellung: "Exhibition Opening: Material Echoes",
  konzert: "Global Sound Forum",
} as const;

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
