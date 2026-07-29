import type { Event, Partner } from "@unveiled/db";
import { buildVariantUrl, readImagePublicBaseUrl } from "@unveiled/images/urls";

import type { EventFormDefaults } from "../components/admin/event-admin-types";
import {
  type EventFormValues,
  formatEventDateInput,
  formatEventTimeInput,
} from "./admin-event-form";

export type PartnerOption = Pick<Partner, "id" | "name" | "address">;

export function toPartnerOptions(partners: Partner[]): PartnerOption[] {
  return partners.map((partner) => ({
    id: partner.id,
    name: partner.name,
    address: partner.address,
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
    address: event.address,
    neighborhood: event.neighborhood,
    category: event.category,
    eventType: event.eventType,
    tags: event.tags,
    eventDate: formatEventDateInput(event.dateTime),
    eventTime: formatEventTimeInput(event.dateTime),
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
    targetAgeGroups: event.targetAgeGroups,
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
    address: values.address,
    neighborhood: values.neighborhood,
    category: values.category,
    eventType: values.eventType,
    tags: values.tags,
    eventDate: values.eventDate,
    eventTime: values.eventTime,
    timingMode: values.timingMode,
    creditPrice: values.creditPrice,
    totalCapacity: values.totalCapacity,
    ticketType: values.ticketType,
    secretCode: values.secretCode,
    eventWebsiteUrl: values.eventWebsiteUrl,
    barrierFree: values.barrierFree,
    languageIndependent: values.languageIndependent,
    languages: values.languages,
    targetAgeGroups: values.targetAgeGroups,
    lat: values.lat,
    lng: values.lng,
    currentImageUrl: null,
    currentImageId,
    imagePublicBaseUrl: resolveImagePublicBaseUrl(),
  };
}
