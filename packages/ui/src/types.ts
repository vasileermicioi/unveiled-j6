export type CatalogLocale = "de" | "en";

export type EventCardTicketType = "SECRET_CODE" | "VOUCHER";

export type EventCardItem = {
  id: string;
  title: string;
  partnerName: string;
  dateTime: Date;
  neighborhood: string;
  creditPrice: number;
  remainingCapacity: number;
  ticketType: EventCardTicketType;
  category: string;
  imageId: string;
};

export type EventCardViewerState =
  | { kind: "guest" }
  | { kind: "member"; subscriptionActive: boolean; saved?: boolean };
