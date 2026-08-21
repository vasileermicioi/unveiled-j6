import { describe, expect, test } from "bun:test";
import { type PrebuiltImageVariantsInput, VARIANT_FILENAMES } from "@unveiled/images";

import type { EventFormValues } from "./admin-event-form";
import { formValuesToDefaults } from "./admin-event-route-helpers";

function baseValues(overrides: Partial<EventFormValues> = {}): EventFormValues {
  return {
    partnerId: "partner-1",
    titleDe: "Jazz Night",
    titleEn: "Jazz Night",
    descriptionDe: "Live set",
    descriptionEn: "Live set",
    street: "Main St",
    houseNumber: "1",
    addressLine2: null,
    country: "DE",
    city: "berlin",
    zipCode: "10115",
    category: "Music",
    eventType: "Concert",
    tags: [],
    dateTimeRows: [{ date: "2026-08-01", time: "20:00", credits: "2" }],
    timingMode: "TIME_SLOT",
    creditPrice: 2,
    totalCapacity: 15,
    capacityMode: "SHARED",
    ticketType: "SECRET_CODE",
    secretCode: "JAZZ123",
    eventWebsiteUrl: null,
    promoCodes: [],
    voucherPdfs: [],
    replaceUnusedInventory: false,
    languageIndependent: false,
    languages: null,
    hasSubtitles: false,
    subtitleLanguages: null,
    lat: null,
    lng: null,
    imageUpload: null,
    imageUrl: null,
    imagePrebuilt: null,
    stagedImageId: null,
    imageCredit: "",
    ...overrides,
  };
}

function stubPrebuilt(imageId: string): PrebuiltImageVariantsInput {
  const variants = {} as PrebuiltImageVariantsInput["variants"];
  for (const filename of VARIANT_FILENAMES) {
    variants[filename] = Buffer.from("x");
  }
  return { imageId, variants };
}

describe("formValuesToDefaults", () => {
  test("retains stagedImageId as currentImageId on error re-render", () => {
    const defaults = formValuesToDefaults(
      baseValues({ stagedImageId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee" }),
    );
    expect(defaults.currentImageId).toBe("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    expect(defaults.currentImageUrl).toBeNull();
  });

  test("prefers complete prebuilt imageId over stagedImageId", () => {
    const defaults = formValuesToDefaults(
      baseValues({
        stagedImageId: "11111111-1111-1111-1111-111111111111",
        imagePrebuilt: stubPrebuilt("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee"),
      }),
    );
    expect(defaults.currentImageId).toBe("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
  });

  test("leaves currentImageId null when no staged or prebuilt image", () => {
    const defaults = formValuesToDefaults(baseValues());
    expect(defaults.currentImageId).toBeNull();
  });

  test("round-trips datetime row credits and range builder fields on error re-render", () => {
    const defaults = formValuesToDefaults(
      baseValues({
        dateTimeRows: [
          { date: "2026-08-01", time: "20:00", credits: "1" },
          { date: "2026-08-08", time: "21:00", credits: "3" },
        ],
        creditPrice: 1,
        rangeStart: "2026-08-01",
        rangeEnd: "2026-08-08",
        rangeSlots: [
          { time: "20:00", credits: "1" },
          { time: "21:00", credits: "3" },
        ],
      }),
    );
    expect(defaults.dateTimeRows).toEqual([
      { date: "2026-08-01", time: "20:00", credits: "1" },
      { date: "2026-08-08", time: "21:00", credits: "3" },
    ]);
    expect(defaults.rangeStart).toBe("2026-08-01");
    expect(defaults.rangeEnd).toBe("2026-08-08");
    expect(defaults.rangeSlots).toEqual([
      { time: "20:00", credits: "1" },
      { time: "21:00", credits: "3" },
    ]);
  });

  test("round-trips imageCredit onto currentImageCredit", () => {
    const defaults = formValuesToDefaults(baseValues({ imageCredit: "Photo: Ada" }));
    expect(defaults.currentImageCredit).toBe("Photo: Ada");
  });

  test("round-trips capacityMode and per-row capacities", () => {
    const defaults = formValuesToDefaults(
      baseValues({
        capacityMode: "PER_OCCURRENCE",
        totalCapacity: 10,
        dateTimeRows: [
          { date: "2026-08-01", time: "20:00", credits: "1", capacity: "4" },
          { date: "2026-08-08", time: "21:00", credits: "3", capacity: "6" },
        ],
      }),
    );
    expect(defaults.capacityMode).toBe("PER_OCCURRENCE");
    expect(defaults.totalCapacity).toBe(10);
    expect(defaults.dateTimeRows).toEqual([
      { date: "2026-08-01", time: "20:00", credits: "1", capacity: "4" },
      { date: "2026-08-08", time: "21:00", credits: "3", capacity: "6" },
    ]);
  });
});
