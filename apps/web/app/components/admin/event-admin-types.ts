import type { SecretCodeMode, TicketType, TimingMode } from "@unveiled/db";

export type EventFormDefaults = Partial<{
  partnerId: string;
  title: string;
  description: string;
  address: string;
  neighborhood: string;
  category: string;
  eventType: string;
  tags: string[];
  eventDate: string;
  eventTime: string;
  timingMode: TimingMode;
  creditPrice: number;
  totalCapacity: number;
  ticketType: TicketType;
  secretCodeMode: SecretCodeMode;
  secretCode: string | null;
  promoCode: string | null;
  eventWebsiteUrl: string | null;
  barrierFree: boolean | null;
  languages: string[] | null;
  targetAgeGroups: string[] | null;
  lat: string | null;
  lng: string | null;
  mapZoom: number | null;
  currentImageUrl: string | null;
}>;

export type PartnerOption = {
  id: string;
  name: string;
};
