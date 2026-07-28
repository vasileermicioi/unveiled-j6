import type { CreateEventInput, UpdateEventInput } from "@unveiled/db";

import type { EventFormValues } from "./admin-event-form";
import { eventFormValuesToDateTime } from "./admin-event-form";

export function toCreateEventInput(values: EventFormValues, uploadedBy: string): CreateEventInput {
  return {
    partnerId: values.partnerId,
    title: values.title,
    description: values.description,
    address: values.address,
    neighborhood: values.neighborhood,
    category: values.category,
    eventType: values.eventType,
    tags: values.tags,
    dateTime: eventFormValuesToDateTime(values),
    timingMode: values.timingMode,
    creditPrice: values.creditPrice,
    totalCapacity: values.totalCapacity,
    ticketType: values.ticketType,
    secretCodeMode: values.secretCodeMode,
    secretCode: values.secretCode,
    promoCode: values.promoCode,
    eventWebsiteUrl: values.eventWebsiteUrl,
    barrierFree: values.barrierFree,
    languageIndependent: values.languageIndependent,
    languages: values.languages,
    targetAgeGroups: values.targetAgeGroups,
    lat: values.lat,
    lng: values.lng,
    imageUpload: values.imageUpload,
    imageUrl: values.imageUrl,
    imagePrebuilt: values.imagePrebuilt,
    stagedImageId: values.stagedImageId,
    uploadedBy,
  };
}

export function toUpdateEventInput(values: EventFormValues, uploadedBy: string): UpdateEventInput {
  return {
    partnerId: values.partnerId,
    title: values.title,
    description: values.description,
    address: values.address,
    neighborhood: values.neighborhood,
    category: values.category,
    eventType: values.eventType,
    tags: values.tags,
    dateTime: eventFormValuesToDateTime(values),
    timingMode: values.timingMode,
    creditPrice: values.creditPrice,
    totalCapacity: values.totalCapacity,
    ticketType: values.ticketType,
    secretCodeMode: values.secretCodeMode,
    secretCode: values.secretCode,
    promoCode: values.promoCode,
    eventWebsiteUrl: values.eventWebsiteUrl,
    barrierFree: values.barrierFree,
    languageIndependent: values.languageIndependent,
    languages: values.languages,
    targetAgeGroups: values.targetAgeGroups,
    lat: values.lat,
    lng: values.lng,
    imageUpload: values.imageUpload,
    imageUrl: values.imageUrl,
    imagePrebuilt: values.imagePrebuilt,
    stagedImageId: values.stagedImageId,
    uploadedBy,
  };
}

export function toSeriesCreateInput(
  values: EventFormValues,
  slots: Date[],
  uploadedBy: string,
): Omit<CreateEventInput, "dateTime"> & { slots: Date[] } {
  // Series forms omit event_date/event_time — do not call eventFormValuesToDateTime.
  return {
    partnerId: values.partnerId,
    title: values.title,
    description: values.description,
    address: values.address,
    neighborhood: values.neighborhood,
    category: values.category,
    eventType: values.eventType,
    tags: values.tags,
    timingMode: values.timingMode,
    creditPrice: values.creditPrice,
    totalCapacity: values.totalCapacity,
    ticketType: values.ticketType,
    secretCodeMode: values.secretCodeMode,
    secretCode: values.secretCode,
    promoCode: values.promoCode,
    eventWebsiteUrl: values.eventWebsiteUrl,
    barrierFree: values.barrierFree,
    languageIndependent: values.languageIndependent,
    languages: values.languages,
    targetAgeGroups: values.targetAgeGroups,
    lat: values.lat,
    lng: values.lng,
    imageUpload: values.imageUpload,
    imageUrl: values.imageUrl,
    imagePrebuilt: values.imagePrebuilt,
    stagedImageId: values.stagedImageId,
    uploadedBy,
    slots,
  };
}
