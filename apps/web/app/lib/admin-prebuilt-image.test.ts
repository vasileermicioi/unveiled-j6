import { describe, expect, test } from "bun:test";
import { VARIANT_FILENAMES } from "@unveiled/images";

import { parsePrebuiltImageVariants } from "./admin-prebuilt-image";

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

function jpegFile(name: string, bytes = 12): File {
  return new File([new Uint8Array(bytes)], name, { type: "image/jpeg" });
}

function completePrebuiltBody(extra: Record<string, string | File> = {}) {
  const body: Record<string, string | File> = {
    imageId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
    claimedWidth: "1200",
    claimedHeight: "800",
  };
  for (const filename of VARIANT_FILENAMES) {
    body[filename] = jpegFile(filename);
  }
  return { ...body, ...extra };
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
    delete body["small-320.jpg"];
    const parsed = await parsePrebuiltImageVariants(body, asString, asFile);
    expect(parsed).toBeNull();
  });

  test("returns null without imageId", async () => {
    const body = completePrebuiltBody();
    delete body.imageId;
    const parsed = await parsePrebuiltImageVariants(body, asString, asFile);
    expect(parsed).toBeNull();
  });
});
