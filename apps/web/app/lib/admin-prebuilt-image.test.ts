import { describe, expect, test } from "bun:test";
import { VARIANT_FILENAMES } from "@unveiled/images";

import {
  parseGalleryImageIds,
  parseGalleryImageIdsFromQuery,
  parsePrebuiltImageVariantSets,
  parsePrebuiltImageVariants,
} from "./admin-prebuilt-image";

function asString(value: string | File | (string | File)[] | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (Array.isArray(value)) {
    const first = value[0];
    return typeof first === "string" ? first : undefined;
  }
  return typeof value === "string" ? value : undefined;
}

function asFile(value: string | File | (string | File)[] | undefined): File | Blob | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (Array.isArray(value)) {
    const first = value[0];
    return first instanceof File || first instanceof Blob ? first : undefined;
  }
  return value instanceof File || value instanceof Blob ? value : undefined;
}

function webpFile(name: string, bytes = 12): File {
  return new File([new Uint8Array(bytes)], name, { type: "image/webp" });
}

function completePrebuiltBody(extra: Record<string, string | File> = {}) {
  const body: Record<string, string | File> = {
    imageId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    claimedWidth: "1200",
    claimedHeight: "800",
  };
  for (const filename of VARIANT_FILENAMES) {
    body[filename] = webpFile(filename);
  }
  return { ...body, ...extra };
}

function gallerySetFields(index: number, imageId: string): Record<string, string | File> {
  const prefix = `gallery[${index}].`;
  const body: Record<string, string | File> = {
    [`${prefix}imageId`]: imageId,
    [`${prefix}claimedWidth`]: "1200",
    [`${prefix}claimedHeight`]: "800",
  };
  for (const filename of VARIANT_FILENAMES) {
    body[`${prefix}${filename}`] = webpFile(filename);
  }
  return body;
}

describe("parsePrebuiltImageVariants", () => {
  test("parses a complete prebuilt set", async () => {
    const parsed = await parsePrebuiltImageVariants(completePrebuiltBody(), asString, asFile);
    expect(parsed).not.toBeNull();
    expect(parsed?.imageId).toBe("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");
    expect(parsed?.claimedWidth).toBe(1200);
    expect(parsed?.claimedHeight).toBe(800);
    expect(Object.keys(parsed?.variants ?? {}).sort()).toEqual([...VARIANT_FILENAMES].sort());
  });

  test("returns null when any variant is missing", async () => {
    const body = completePrebuiltBody();
    delete body["small-320.webp"];
    const parsed = await parsePrebuiltImageVariants(body, asString, asFile);
    expect(parsed).toBeNull();
  });

  test("returns null without imageId", async () => {
    const body = completePrebuiltBody();
    delete body.imageId;
    const parsed = await parsePrebuiltImageVariants(body, asString, asFile);
    expect(parsed).toBeNull();
  });

  test("prefers base64 backup when file bytes are not WebP", async () => {
    const riff = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50, 0x01,
    ]);
    const body = completePrebuiltBody();
    for (const filename of VARIANT_FILENAMES) {
      body[filename] = new File([new Uint8Array(8)], filename, { type: "image/png" });
      body[`${filename}__b64`] = Buffer.from(riff).toString("base64");
    }
    const parsed = await parsePrebuiltImageVariants(body, asString, asFile);
    expect(parsed).not.toBeNull();
    expect(parsed?.variants["hero-1920.webp"]?.[0]).toBe(0x52);
    expect(parsed?.variants["hero-1920.webp"]?.[8]).toBe(0x57);
  });
});

describe("parsePrebuiltImageVariantSets", () => {
  test("returns empty when galleryCount is missing", async () => {
    const parsed = await parsePrebuiltImageVariantSets({}, asString, asFile);
    expect(parsed).toEqual([]);
  });

  test("parses one indexed set", async () => {
    const body = {
      galleryCount: "1",
      ...gallerySetFields(0, "11111111-1111-1111-1111-111111111111"),
    };
    const parsed = await parsePrebuiltImageVariantSets(body, asString, asFile);
    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.imageId).toBe("11111111-1111-1111-1111-111111111111");
  });

  test("parses two indexed sets", async () => {
    const body = {
      galleryCount: "2",
      ...gallerySetFields(0, "11111111-1111-1111-1111-111111111111"),
      ...gallerySetFields(1, "22222222-2222-2222-2222-222222222222"),
    };
    const parsed = await parsePrebuiltImageVariantSets(body, asString, asFile);
    expect(parsed).toHaveLength(2);
    expect(parsed.map((set) => set.imageId)).toEqual([
      "11111111-1111-1111-1111-111111111111",
      "22222222-2222-2222-2222-222222222222",
    ]);
  });

  test("returns empty when any indexed set is incomplete", async () => {
    const body = {
      galleryCount: "2",
      ...gallerySetFields(0, "11111111-1111-1111-1111-111111111111"),
      ...gallerySetFields(1, "22222222-2222-2222-2222-222222222222"),
    };
    delete body["gallery[1].small-320.webp"];
    const parsed = await parsePrebuiltImageVariantSets(body, asString, asFile);
    expect(parsed).toEqual([]);
  });
});

describe("parseGalleryImageIds", () => {
  test("returns empty for missing field", () => {
    expect(parseGalleryImageIds({}, asString)).toEqual([]);
  });

  test("parses a single image id", () => {
    expect(parseGalleryImageIds({ imageIds: "aaa" }, asString)).toEqual(["aaa"]);
  });

  test("parses repeated image ids and de-duplicates", () => {
    expect(parseGalleryImageIds({ imageIds: ["aaa", "bbb", "aaa"] }, asString)).toEqual([
      "aaa",
      "bbb",
    ]);
  });
});

describe("parseGalleryImageIdsFromQuery", () => {
  test("parses repeated query values and comma-separated", () => {
    expect(parseGalleryImageIdsFromQuery(["aaa", "bbb,ccc"])).toEqual(["aaa", "bbb", "ccc"]);
  });

  test("returns empty for undefined", () => {
    expect(parseGalleryImageIdsFromQuery(undefined)).toEqual([]);
  });
});
