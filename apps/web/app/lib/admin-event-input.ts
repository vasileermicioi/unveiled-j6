import type { CreateEventInput, UpdateEventInput } from "@unveiled/db";

import type { EventFormValues } from "./admin-event-form";
import { eventFormValuesToOccurrenceLists } from "./admin-event-form";

function capacityFields(values: EventFormValues): {
  capacityMode: EventFormValues["capacityMode"];
  occurrenceCapacities?: number[];
} {
  const { occurrenceCapacities } = eventFormValuesToOccurrenceLists(values);
  const capacityMode = values.capacityMode ?? "SHARED";
  return {
    capacityMode,
    ...(capacityMode === "PER_OCCURRENCE" ? { occurrenceCapacities } : {}),
  };
}

export function toCreateEventInput(values: EventFormValues, uploadedBy: string): CreateEventInput {
  const { dateTimes, occurrenceCreditPrices } = eventFormValuesToOccurrenceLists(values);
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
    dateTimes,
    occurrenceCreditPrices,
    timingMode: values.timingMode,
    creditPrice: values.creditPrice,
    totalCapacity: values.totalCapacity,
    ...capacityFields(values),
    ticketType: values.ticketType,
    secretCode: values.secretCode,
    eventWebsiteUrl: values.eventWebsiteUrl,
    languageIndependent: values.languageIndependent,
    languages: values.languages,
    hasSubtitles: values.hasSubtitles,
    subtitleLanguage: values.subtitleLanguage,
    lat: values.lat,
    lng: values.lng,
    imageUpload: values.imageUpload,
    imageUrl: values.imageUrl,
    imagePrebuilt: values.imagePrebuilt,
    stagedImageId: values.stagedImageId,
    imageCredit: values.imageCredit,
    uploadedBy,
  };
}

export function toUpdateEventInput(values: EventFormValues, uploadedBy: string): UpdateEventInput {
  const { dateTimes, occurrenceCreditPrices } = eventFormValuesToOccurrenceLists(values);
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
    dateTimes,
    occurrenceCreditPrices,
    timingMode: values.timingMode,
    creditPrice: values.creditPrice,
    totalCapacity: values.totalCapacity,
    ...capacityFields(values),
    ticketType: values.ticketType,
    secretCode: values.secretCode,
    eventWebsiteUrl: values.eventWebsiteUrl,
    languageIndependent: values.languageIndependent,
    languages: values.languages,
    hasSubtitles: values.hasSubtitles,
    subtitleLanguage: values.subtitleLanguage,
    lat: values.lat,
    lng: values.lng,
    imageUpload: values.imageUpload,
    imageUrl: values.imageUrl,
    imagePrebuilt: values.imagePrebuilt,
    stagedImageId: values.stagedImageId,
    imageCredit: values.imageCredit,
    uploadedBy,
  };
}

export function toSeriesCreateInput(
  values: EventFormValues,
  slots: Date[],
  uploadedBy: string,
): Omit<CreateEventInput, "dateTimes"> & { slots: Date[] } {
  // Series forms omit datetime rows — do not call eventFormValuesToDateTimes.
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
    timingMode: values.timingMode,
    creditPrice: values.creditPrice,
    totalCapacity: values.totalCapacity,
    ticketType: values.ticketType,
    secretCode: values.secretCode,
    eventWebsiteUrl: values.eventWebsiteUrl,
    languageIndependent: values.languageIndependent,
    languages: values.languages,
    hasSubtitles: values.hasSubtitles,
    subtitleLanguage: values.subtitleLanguage,
    lat: values.lat,
    lng: values.lng,
    imageUpload: values.imageUpload,
    imageUrl: values.imageUrl,
    imagePrebuilt: values.imagePrebuilt,
    stagedImageId: values.stagedImageId,
    imageCredit: values.imageCredit,
    uploadedBy,
    slots,
  };
}
