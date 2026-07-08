import type { EventCardItem } from "../types";

/** Placeholder image ID for Ladle stories — URLs resolve via IMAGE_PUBLIC_BASE_URL (see vite define). */
export const mockImageId = "00000000-0000-4000-8000-000000000001";

const baseDate = new Date("2026-08-15T19:00:00+02:00");

export const sampleEventAvailable: EventCardItem = {
  id: "00000000-0000-4000-8000-000000000002",
  title: "Poetry & Jazz Night",
  partnerName: "Literaturhaus Berlin",
  dateTime: baseDate,
  neighborhood: "Charlottenburg",
  creditPrice: 2,
  remainingCapacity: 12,
  ticketType: "SECRET_CODE",
  category: "Music",
  imageId: mockImageId,
};

export const sampleEventSoldOut: EventCardItem = {
  ...sampleEventAvailable,
  remainingCapacity: 0,
};
