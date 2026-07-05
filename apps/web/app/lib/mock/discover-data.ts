/**
 * Phase 1 placeholder — replaced by DB queries in Phase 4.
 * Mock discover preview data for the marketing `/discover` page.
 */

export type MockDiscoverEvent = {
  id: string;
  title: string;
  partnerName: string;
  date: string;
  creditPrice: number;
  remainingCapacity: number;
  imageVariant: "a" | "b" | "c" | "d" | "e" | "f";
};

export type MockDiscoverPartner = {
  id: string;
  name: string;
  address: string;
  initial: string;
};

export const MOCK_DISCOVER_STATS = {
  eventCount: 24,
  partnerCount: 12,
} as const;

export const MOCK_DISCOVER_EVENTS: MockDiscoverEvent[] = [
  {
    id: "mock-event-1",
    title: "After Hours: Contemporary Dance",
    partnerName: "Radialsystem",
    date: "2026-07-18T20:00:00+02:00",
    creditPrice: 2,
    remainingCapacity: 8,
    imageVariant: "a",
  },
  {
    id: "mock-event-2",
    title: "Neue Filme, Neue Stimmen",
    partnerName: "Babylon Kino",
    date: "2026-07-22T19:30:00+02:00",
    creditPrice: 1,
    remainingCapacity: 14,
    imageVariant: "b",
  },
  {
    id: "mock-event-3",
    title: "Late Night Jazz Session",
    partnerName: "A-Trane Jazzclub",
    date: "2026-07-25T21:00:00+02:00",
    creditPrice: 2,
    remainingCapacity: 0,
    imageVariant: "c",
  },
  {
    id: "mock-event-4",
    title: "Berlinische Galerie: Guided Tour",
    partnerName: "Berlinische Galerie",
    date: "2026-07-28T18:00:00+02:00",
    creditPrice: 1,
    remainingCapacity: 6,
    imageVariant: "d",
  },
  {
    id: "mock-event-5",
    title: "Impro Theatre Night",
    partnerName: "Theater an der Parkaue",
    date: "2026-08-01T20:30:00+02:00",
    creditPrice: 2,
    remainingCapacity: 10,
    imageVariant: "e",
  },
  {
    id: "mock-event-6",
    title: "Open Air Cinema: Classics",
    partnerName: "Freiluftkino Kreuzberg",
    date: "2026-08-05T21:15:00+02:00",
    creditPrice: 1,
    remainingCapacity: 20,
    imageVariant: "f",
  },
];

export const MOCK_DISCOVER_PARTNERS: MockDiscoverPartner[] = [
  {
    id: "mock-partner-1",
    name: "Babylon Kino",
    address: "Rosa-Luxemburg-Str. 30, Berlin",
    initial: "B",
  },
  {
    id: "mock-partner-2",
    name: "Radialsystem",
    address: "Holmarktstr. 33, Berlin",
    initial: "R",
  },
  {
    id: "mock-partner-3",
    name: "Berlinische Galerie",
    address: "Alte Jakobstr. 124, Berlin",
    initial: "B",
  },
  {
    id: "mock-partner-4",
    name: "A-Trane Jazzclub",
    address: "Bleibtreustr. 1, Berlin",
    initial: "A",
  },
  {
    id: "mock-partner-5",
    name: "Theater an der Parkaue",
    address: "Parkaue 29, Berlin",
    initial: "T",
  },
  {
    id: "mock-partner-6",
    name: "Freiluftkino Kreuzberg",
    address: "Hasenheide 32, Berlin",
    initial: "F",
  },
  {
    id: "mock-partner-7",
    name: "Silent Green",
    address: "Wedding, Berlin",
    initial: "S",
  },
  {
    id: "mock-partner-8",
    name: "Haus der Kulturen der Welt",
    address: "John-Foster-Dulles-Allee 10, Berlin",
    initial: "H",
  },
];
