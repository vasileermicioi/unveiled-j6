import type {
  OpeningHoursWeek,
  TicketType,
  TimingMode,
  VoucherInventoryCounts,
} from "@unveiled/db";

export type EventDateTimeRow = {
  date: string;
  time: string;
  /** Form string; parsed to an integer `>= 0` on submit. */
  credits: string;
};

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
  dateTimeRows: EventDateTimeRow[];
  rangeStart: string;
  rangeEnd: string;
  rangeSlots: { time: string; credits: string }[];
  timingMode: TimingMode;
  creditPrice: number;
  totalCapacity: number;
  ticketType: TicketType;
  secretCode: string | null;
  eventWebsiteUrl: string | null;
  eventId: string;
  inventoryCounts: VoucherInventoryCounts;
  languageIndependent: boolean;
  languages: string[] | null;
  hasSubtitles: boolean;
  subtitleLanguage: string | null;
  lat: string | null;
  lng: string | null;
  currentImageUrl: string | null;
  currentImageId: string | null;
  currentImageCredit: string | null;
  imagePublicBaseUrl: string | null;
}>;

export type PartnerOption = {
  id: string;
  name: string;
  street: string;
  houseNumber: string;
  addressLine2: string | null;
  zipCode: string;
  hasOpeningHours: boolean;
  openingHours: OpeningHoursWeek | null;
};
