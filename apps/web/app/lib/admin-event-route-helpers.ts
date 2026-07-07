import type { Event, Partner } from "@unveiled/db";

import {
  type EventFormValues,
  formatEventDateInput,
  formatEventTimeInput,
} from "./admin-event-form";

export type PartnerOption = Pick<Partner, "id" | "name">;

export function toPartnerOptions(partners: Partner[]): PartnerOption[] {
  return partners.map((partner) => ({ id: partner.id, name: partner.name }));
}

export function eventToFormDefaults(
  event: Event,
): Partial<EventFormValues> & { partnerId: string } {
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
    secretCodeMode: event.secretCodeMode ?? undefined,
    secretCode: event.secretCode,
    promoCode: event.promoCode,
    eventWebsiteUrl: event.eventWebsiteUrl,
    barrierFree: event.barrierFree,
    languages: event.languages,
    targetAgeGroups: event.targetAgeGroups,
    lat: event.lat,
    lng: event.lng,
    imageUrl: null,
    imageUpload: null,
  };
}

export function formValuesToDefaults(values: EventFormValues) {
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
    secretCodeMode: values.secretCodeMode,
    secretCode: values.secretCode,
    promoCode: values.promoCode,
    eventWebsiteUrl: values.eventWebsiteUrl,
    barrierFree: values.barrierFree,
    languages: values.languages,
    targetAgeGroups: values.targetAgeGroups,
    lat: values.lat,
    lng: values.lng,
    imageUrl: values.imageUrl,
  };
}
