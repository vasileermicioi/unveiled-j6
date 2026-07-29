import { describe, expect, test } from "bun:test";
import { type PrebuiltImageVariantsInput, VARIANT_FILENAMES } from "@unveiled/images";

import type { EventFormValues } from "./admin-event-form";
import { formValuesToDefaults } from "./admin-event-route-helpers";

function baseValues(overrides: Partial<EventFormValues> = {}): EventFormValues {
  return {
    partnerId: "partner-1",
    title: "Jazz Night",
    description: "Live set",
    address: "Main St 1",
    neighborhood: "Mitte",
    category: "Music",
    eventType: "Concert",
    tags: [],
    eventDate: "2026-08-01",
    eventTime: "20:00",
    timingMode: "TIME_SLOT",
    creditPrice: 2,
    totalCapacity: 15,
    ticketType: "SECRET_CODE",
    secretCode: "JAZZ123",
    eventWebsiteUrl: null,
    promoCodes: [],
    voucherPdfs: [],
    replaceUnusedInventory: false,
    barrierFree: null,
    languageIndependent: false,
    languages: null,
    targetAgeGroups: null,
    lat: null,
    lng: null,
    imageUpload: null,
    imageUrl: null,
    imagePrebuilt: null,
    stagedImageId: null,
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
});
