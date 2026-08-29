import type { Event, Partner } from "@unveiled/db";
import { buildVariantUrl, readImagePublicBaseUrl } from "@unveiled/images/urls";

import type { EventFormDefaults } from "../components/admin/event-admin-types";
import { type EventFormValues, eventDateTimesToFormRows } from "./admin-event-form";

export type PartnerOption = Pick<
  Partner,
  | "id"
  | "name"
  | "street"
  | "houseNumber"
  | "addressLine2"
  | "zipCode"
  | "hasOpeningHours"
  | "openingHours"
>;

export function toPartnerOptions(partners: Partner[]): PartnerOption[] {
  return partners.map((partner) => ({
    id: partner.id,
    name: partner.name,
    street: partner.street,
    houseNumber: partner.houseNumber,
    addressLine2: partner.addressLine2,
    zipCode: partner.zipCode,
    hasOpeningHours: partner.hasOpeningHours,
    openingHours: partner.openingHours ?? null,
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
  currentImageCredit?: string | null,
): EventFormDefaults & { partnerId: string } {
  let currentImageUrl: string | null = null;
  try {
    currentImageUrl = buildVariantUrl(event.imageId, "small-320.webp");
  } catch {
    currentImageUrl = null;
  }

  return {
    partnerId: event.partnerId,
    titleDe: event.titleDe,
    titleEn: event.titleEn,
    descriptionDe: event.descriptionDe,
    descriptionEn: event.descriptionEn,
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
    capacityMode: event.capacityMode,
    ticketType: event.ticketType,
    secretCode: event.secretCode,
    eventWebsiteUrl: event.eventWebsiteUrl,
    eventId: event.id,
    published: event.published,
    inventoryCounts,
    languageIndependent: event.languageIndependent,
    languages: event.languages,
    hasSubtitles: event.hasSubtitles,
    subtitleLanguages: event.subtitleLanguages,
    lat: event.lat,
    lng: event.lng,
    currentImageUrl,
    currentImageId: event.imageId,
    currentImageCredit: currentImageCredit ?? null,
    imagePublicBaseUrl: resolveImagePublicBaseUrl(),
  };
}

export function formValuesToDefaults(values: EventFormValues): EventFormDefaults {
  const currentImageId = values.imagePrebuilt?.imageId ?? values.stagedImageId ?? null;

  return {
    partnerId: values.partnerId,
    titleDe: values.titleDe,
    titleEn: values.titleEn,
    descriptionDe: values.descriptionDe,
    descriptionEn: values.descriptionEn,
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
    rangeStart: values.rangeStart,
    rangeEnd: values.rangeEnd,
    rangeSlots: values.rangeSlots,
    timingMode: values.timingMode,
    creditPrice: values.creditPrice,
    totalCapacity: values.totalCapacity,
    capacityMode: values.capacityMode ?? "SHARED",
    ticketType: values.ticketType,
    secretCode: values.secretCode,
    eventWebsiteUrl: values.eventWebsiteUrl,
    languageIndependent: values.languageIndependent,
    languages: values.languages,
    hasSubtitles: values.hasSubtitles,
    subtitleLanguages: values.subtitleLanguages,
    lat: values.lat,
    lng: values.lng,
    currentImageUrl: null,
    currentImageId,
    currentImageCredit: values.imageCredit,
    imagePublicBaseUrl: resolveImagePublicBaseUrl(),
  };
}
