import type { Event, Partner } from "@unveiled/db";
import { buildVariantUrl, readImagePublicBaseUrl } from "@unveiled/images/urls";

import type { EventFormDefaults } from "../components/admin/event-admin-types";
import { type EventFormValues, eventDateTimesToFormRows } from "./admin-event-form";

export type PartnerOption = Pick<
  Partner,
  "id" | "name" | "street" | "houseNumber" | "addressLine2" | "zipCode"
>;

export function toPartnerOptions(partners: Partner[]): PartnerOption[] {
  return partners.map((partner) => ({
    id: partner.id,
    name: partner.name,
    street: partner.street,
    houseNumber: partner.houseNumber,
    addressLine2: partner.addressLine2,
    zipCode: partner.zipCode,
  }));
}

function resolveImagePublicBaseUrl(): string | null {
  try {
    return readImagePublicBaseUrl();
  } catch {
    return null;
  }
}

export function eventToFormDefaults(
  event: Event,
  inventoryCounts?: EventFormDefaults["inventoryCounts"],
): EventFormDefaults & { partnerId: string } {
  let currentImageUrl: string | null = null;
  try {
    currentImageUrl = buildVariantUrl(event.imageId, "small-320.webp");
  } catch {
    currentImageUrl = null;
  }

  return {
    partnerId: event.partnerId,
    title: event.title,
    description: event.description,
    street: event.street,
    houseNumber: event.houseNumber,
    addressLine2: event.addressLine2,
    zipCode: event.zipCode,
    country: event.country,
    city: event.city,
    category: event.category,
    eventType: event.eventType,
    tags: event.tags,
    dateTimeRows: eventDateTimesToFormRows(event),
    timingMode: event.timingMode,
    creditPrice: event.creditPrice,
    totalCapacity: event.totalCapacity,
    ticketType: event.ticketType,
    secretCode: event.secretCode,
    eventWebsiteUrl: event.eventWebsiteUrl,
    eventId: event.id,
    inventoryCounts,
    barrierFree: event.barrierFree,
    languageIndependent: event.languageIndependent,
    languages: event.languages,
    hasSubtitles: event.hasSubtitles,
    subtitleLanguage: event.subtitleLanguage,
    lat: event.lat,
    lng: event.lng,
    currentImageUrl,
    currentImageId: event.imageId,
    imagePublicBaseUrl: resolveImagePublicBaseUrl(),
  };
}

export function formValuesToDefaults(values: EventFormValues): EventFormDefaults {
  const currentImageId = values.imagePrebuilt?.imageId ?? values.stagedImageId ?? null;

  return {
    partnerId: values.partnerId,
    title: values.title,
    description: values.description,
    street: values.street,
    houseNumber: values.houseNumber,
    addressLine2: values.addressLine2,
    zipCode: values.zipCode,
    country: values.country,
    city: values.city,
    category: values.category,
    eventType: values.eventType,
    tags: values.tags,
    dateTimeRows: values.dateTimeRows,
    timingMode: values.timingMode,
    creditPrice: values.creditPrice,
    totalCapacity: values.totalCapacity,
    ticketType: values.ticketType,
    secretCode: values.secretCode,
    eventWebsiteUrl: values.eventWebsiteUrl,
    barrierFree: values.barrierFree,
    languageIndependent: values.languageIndependent,
    languages: values.languages,
    hasSubtitles: values.hasSubtitles,
    subtitleLanguage: values.subtitleLanguage,
    lat: values.lat,
    lng: values.lng,
    currentImageUrl: null,
    currentImageId,
    imagePublicBaseUrl: resolveImagePublicBaseUrl(),
  };
}
