import type { TicketType, TimingMode, VoucherInventoryCounts } from "@unveiled/db";

export type EventFormDefaults = Partial<{
  partnerId: string;
  title: string;
  description: string;
  street: string;
  houseNumber: string;
  addressLine2: string | null;
  zipCode: string;
  country?: string;
  city?: string;
  category: string;
  eventType: string;
  tags: string[];
  eventDate: string;
  eventTime: string;
  timingMode: TimingMode;
  creditPrice: number;
  totalCapacity: number;
  ticketType: TicketType;
  secretCode: string | null;
  eventWebsiteUrl: string | null;
  eventId: string;
  inventoryCounts: VoucherInventoryCounts;
  barrierFree: boolean | null;
  languageIndependent: boolean;
  languages: string[] | null;
  hasSubtitles: boolean;
  subtitleLanguage: string | null;
  targetAgeGroups: string[] | null;
  lat: string | null;
  lng: string | null;
  currentImageUrl: string | null;
  currentImageId: string | null;
  imagePublicBaseUrl: string | null;
}>;

export type PartnerOption = {
  id: string;
  name: string;
  street: string;
  houseNumber: string;
  addressLine2: string | null;
  zipCode: string;
};
