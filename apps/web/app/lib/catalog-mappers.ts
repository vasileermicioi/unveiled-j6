import {
  type Event,
  getEventCategoryLabel,
  isOccurrenceUpcoming,
  type Partner,
  resolveEventCopy,
} from "@unveiled/db";
import { buildVariantUrl } from "@unveiled/images/urls";
import type { EventCardItem } from "@unveiled/ui";

import type { Locale } from "./locale";

export function toEventCardItem(event: Event, locale: Locale): EventCardItem {
  return {
    id: event.id,
    title: resolveEventCopy(event, locale).title,
    partnerName: event.partnerName,
    dateTime: event.dateTime,
    zipCode: event.zipCode,
    creditPrice: event.creditPrice,
    remainingCapacity: event.remainingCapacity,
    ticketType: event.ticketType,
    category: getEventCategoryLabel(locale, event.category),
    imageId: event.imageId,
  };
}

export type DiscoverPartnerTile = {
  id: string;
  name: string;
  address: string;
  initial: string;
  logoUrl?: string;
};

export function toDiscoverPartnerTile(partner: Partner): DiscoverPartnerTile {
  const initial = partner.name.trim().charAt(0).toUpperCase() || "?";
  let logoUrl: string | undefined;

  try {
    logoUrl = buildVariantUrl(partner.logoImageId, "medium-640.webp");
  } catch {
    logoUrl = undefined;
  }

  return {
    id: partner.id,
    name: partner.name,
    address: partner.address,
    initial,
    logoUrl,
  };
}

export function isEventBookable(event: Event, referenceDate: Date = new Date()): boolean {
  return (
    event.remainingCapacity > 0 &&
    isOccurrenceUpcoming(event.dateTime, referenceDate, event.timingMode)
  );
}
