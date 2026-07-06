import type { CreateEventInput } from "./events";
import type { CreatePartnerInput } from "./partners";

export const DEMO_PARTNERS: Omit<CreatePartnerInput, "logoUpload">[] = [
  {
    name: "Haus der Berliner Festspiele",
    address: "Schaperstraße 24, 10719 Berlin",
    contactEmail: "kontakt@berlinerfestspiele.de",
    logoUrl: "https://picsum.photos/seed/unveiled-partner-1/1200/630",
  },
  {
    name: "Silent Green Kulturquartier",
    address: "Gerichtstraße 35, 13347 Berlin",
    contactEmail: "info@silent-green.net",
    logoUrl: "https://picsum.photos/seed/unveiled-partner-2/1200/630",
  },
  {
    name: "Radialsystem",
    address: "Holzmarktstraße 33, 10243 Berlin",
    contactEmail: "office@radialsystem.de",
    logoUrl: "https://picsum.photos/seed/unveiled-partner-3/1200/630",
  },
];

function daysFromNow(days: number, hour = 19, minute = 30): Date {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  date.setUTCHours(hour, minute, 0, 0);
  return date;
}

export function buildDemoEvents(partnerId: string): CreateEventInput[] {
  return [
    {
      partnerId,
      title: "Contemporary Dance Double Bill",
      description:
        "Two Berlin-based choreographers premiere new works exploring movement, light, and urban rhythm.",
      address: "Schaperstraße 24, 10719 Berlin",
      neighborhood: "Wilmersdorf",
      category: "Dance",
      eventType: "Performance",
      tags: ["contemporary", "premiere"],
      dateTime: daysFromNow(7),
      creditPrice: 2,
      secretCode: "DANCE2026",
      imageUrl: "https://picsum.photos/seed/unveiled-event-1/1200/630",
    },
    {
      partnerId,
      title: "Late Night Jazz Session",
      description: "An intimate set with local musicians in a converted warehouse courtyard.",
      address: "Gerichtstraße 35, 13347 Berlin",
      neighborhood: "Wedding",
      category: "Music",
      eventType: "Concert",
      tags: ["jazz", "live"],
      dateTime: daysFromNow(10, 21, 0),
      creditPrice: 1,
      secretCode: "JAZZBERLIN",
      imageUrl: "https://picsum.photos/seed/unveiled-event-2/1200/630",
    },
    {
      partnerId,
      title: "Architecture & Sound Walk",
      description:
        "A guided evening exploring brutalist facades paired with site-specific audio pieces.",
      address: "Holzmarktstraße 33, 10243 Berlin",
      neighborhood: "Friedrichshain",
      category: "Architecture",
      eventType: "Tour",
      tags: ["walk", "audio"],
      dateTime: daysFromNow(14, 18, 0),
      creditPrice: 1,
      secretCode: "SOUNDWALK",
      imageUrl: "https://picsum.photos/seed/unveiled-event-3/1200/630",
    },
  ];
}
