import type { PrebuiltImageVariantsInput } from "@unveiled/images";
import { count, desc, eq, ilike } from "drizzle-orm";

import type { Db } from "../index";
import { composeDisplayAddress, validatePostalCode } from "../location";
import { events } from "../schema/events";
import { type Partner, partners } from "../schema/partners";
import { CatalogValidationError } from "./errors";
import { requireNonEmpty, validateEmail, validateImageSourceExclusive } from "./validation";

/** Lazy — keeps `@unveiled/images` / sip out of client graphs that import `@unveiled/db`. */
function catalogImages() {
  return import("./images");
}

export type ListPartnersOptions = {
  limit?: number;
  offset?: number;
  q?: string;
};

export type CreatePartnerInput = {
  name: string;
  street: string;
  houseNumber: string;
  addressLine2?: string | null;
  zipCode: string;
  country?: string | null;
  city?: string | null;
  contactEmail: string;
  venueCheckInToken?: string | null;
  logoUpload?: Buffer | null;
  logoUrl?: string | null;
  logoPrebuilt?: PrebuiltImageVariantsInput | null;
  uploadedBy?: string | null;
  skipUpload?: boolean;
};

export type UpdatePartnerInput = {
  name?: string;
  street?: string;
  houseNumber?: string;
  addressLine2?: string | null;
  zipCode?: string;
  country?: string | null;
  city?: string | null;
  contactEmail?: string;
  logoUpload?: Buffer | null;
  logoUrl?: string | null;
  logoPrebuilt?: PrebuiltImageVariantsInput | null;
  uploadedBy?: string | null;
  skipUpload?: boolean;
};

function generateVenueCheckInToken(): string {
  return crypto.randomUUID().replace(/-/g, "");
}

export async function getPartnerById(db: Db, partnerId: string): Promise<Partner | null> {
  return (
    (await db.query.partners.findFirst({
      where: eq(partners.id, partnerId),
    })) ?? null
  );
}

function partnerSearchCondition(q?: string) {
  const search = q?.trim();
  if (!search) {
    return undefined;
  }

  const pattern = `%${search}%`;
  return ilike(partners.name, pattern);
}

export async function listPartners(db: Db, options: ListPartnersOptions = {}): Promise<Partner[]> {
  const limit = options.limit ?? 25;
  const offset = options.offset ?? 0;
  const searchCondition = partnerSearchCondition(options.q);

  const baseQuery = db.select().from(partners).$dynamic();
  const filtered = searchCondition ? baseQuery.where(searchCondition) : baseQuery;

  return filtered.orderBy(desc(partners.createdAt), desc(partners.id)).limit(limit).offset(offset);
}

export async function createPartner(db: Db, input: CreatePartnerInput): Promise<Partner> {
  const name = requireNonEmpty(input.name, "name");
  const street = requireNonEmpty(input.street, "street");
  const houseNumber = requireNonEmpty(input.houseNumber, "houseNumber");
  const addressLine2 = input.addressLine2?.trim() || null;
  const location = validatePostalCode({
    country: input.country,
    city: input.city,
    zipCode: input.zipCode,
  });
  const address = composeDisplayAddress({
    street,
    houseNumber,
    addressLine2,
    zipCode: location.zipCode,
    city: location.city,
  });
  const contactEmail = validateEmail(input.contactEmail);

  const { attachImageToPartner, deleteImageRecord } = await catalogImages();
  const logoImageId = await attachImageToPartner(db, "", input.logoUpload, input.logoUrl, {
    uploadedBy: input.uploadedBy,
    skipUpload: input.skipUpload,
    prebuilt: input.logoPrebuilt,
  });

  const venueCheckInToken = input.venueCheckInToken?.trim() || generateVenueCheckInToken();

  try {
    const inserted = await db
      .insert(partners)
      .values({
        name,
        address,
        street,
        houseNumber,
        addressLine2,
        country: location.country,
        city: location.city,
        zipCode: location.zipCode,
        contactEmail,
        logoImageId,
        venueCheckInToken,
      })
      .returning();

    const partner = inserted[0];
    if (!partner) {
      throw new Error("Failed to create partner");
    }

    return partner;
  } catch (error) {
    await deleteImageRecord(db, logoImageId, { skipBucket: input.skipUpload });
    throw error;
  }
}

export async function renamePartnerSyncEvents(
  db: Db,
  partnerId: string,
  newName: string,
): Promise<void> {
  await db
    .update(events)
    .set({
      partnerName: newName,
      updatedAt: new Date(),
    })
    .where(eq(events.partnerId, partnerId));
}

export async function updatePartner(
  db: Db,
  partnerId: string,
  input: UpdatePartnerInput,
): Promise<Partner> {
  const existing = await getPartnerById(db, partnerId);
  if (!existing) {
    throw new CatalogValidationError("PARTNER_NOT_FOUND", `Partner ${partnerId} not found`);
  }

  validateImageSourceExclusive(input.logoUpload, input.logoUrl, {
    prebuilt: input.logoPrebuilt,
  });

  const nextName = input.name !== undefined ? requireNonEmpty(input.name, "name") : existing.name;
  const nextEmail =
    input.contactEmail !== undefined ? validateEmail(input.contactEmail) : existing.contactEmail;

  const locationTouched =
    input.zipCode !== undefined ||
    input.country !== undefined ||
    input.city !== undefined ||
    input.street !== undefined ||
    input.houseNumber !== undefined ||
    input.addressLine2 !== undefined;
  const location = locationTouched
    ? validatePostalCode({
        country: input.country !== undefined ? input.country : existing.country,
        city: input.city !== undefined ? input.city : existing.city,
        zipCode: input.zipCode !== undefined ? input.zipCode : existing.zipCode,
      })
    : {
        country: existing.country,
        city: existing.city,
        zipCode: existing.zipCode,
      };
  const nextStreet =
    input.street !== undefined ? requireNonEmpty(input.street, "street") : existing.street;
  const nextHouseNumber =
    input.houseNumber !== undefined
      ? requireNonEmpty(input.houseNumber, "houseNumber")
      : existing.houseNumber;
  const nextAddressLine2 =
    input.addressLine2 !== undefined ? input.addressLine2?.trim() || null : existing.addressLine2;
  const nextAddress = locationTouched
    ? composeDisplayAddress({
        street: nextStreet,
        houseNumber: nextHouseNumber,
        addressLine2: nextAddressLine2,
        zipCode: location.zipCode,
        city: location.city,
      })
    : existing.address;

  const { replacePartnerLogo, deleteImageRecord } = await catalogImages();
  const previousLogoImageId = existing.logoImageId;
  const nextLogoImageId = await replacePartnerLogo(
    db,
    partnerId,
    previousLogoImageId,
    input.logoUpload,
    input.logoUrl,
    {
      uploadedBy: input.uploadedBy,
      skipUpload: input.skipUpload,
      prebuilt: input.logoPrebuilt,
    },
  );

  const updated = await db
    .update(partners)
    .set({
      name: nextName,
      address: nextAddress,
      street: nextStreet,
      houseNumber: nextHouseNumber,
      addressLine2: nextAddressLine2,
      country: location.country,
      city: location.city,
      zipCode: location.zipCode,
      contactEmail: nextEmail,
      logoImageId: nextLogoImageId,
      updatedAt: new Date(),
    })
    .where(eq(partners.id, partnerId))
    .returning();

  const partner = updated[0];
  if (!partner) {
    throw new Error(`Failed to update partner ${partnerId}`);
  }

  if (nextName !== existing.name) {
    await renamePartnerSyncEvents(db, partnerId, nextName);
  }

  if (previousLogoImageId !== nextLogoImageId) {
    await deleteImageRecord(db, previousLogoImageId, { skipBucket: input.skipUpload });
  }

  return partner;
}

export async function regenerateVenueCheckInToken(db: Db, partnerId: string): Promise<Partner> {
  const existing = await getPartnerById(db, partnerId);
  if (!existing) {
    throw new CatalogValidationError("PARTNER_NOT_FOUND", `Partner ${partnerId} not found`);
  }

  const updated = await db
    .update(partners)
    .set({
      venueCheckInToken: generateVenueCheckInToken(),
      updatedAt: new Date(),
    })
    .where(eq(partners.id, partnerId))
    .returning();

  const partner = updated[0];
  if (!partner) {
    throw new Error(`Failed to regenerate venue check-in token for partner ${partnerId}`);
  }

  return partner;
}

export async function deletePartner(
  db: Db,
  partnerId: string,
  options?: { skipBucket?: boolean },
): Promise<void> {
  const existing = await getPartnerById(db, partnerId);
  if (!existing) {
    throw new CatalogValidationError("PARTNER_NOT_FOUND", `Partner ${partnerId} not found`);
  }

  const [eventCount] = await db
    .select({ count: count() })
    .from(events)
    .where(eq(events.partnerId, partnerId));
  if ((eventCount?.count ?? 0) > 0) {
    throw new CatalogValidationError(
      "PARTNER_HAS_EVENTS",
      "Cannot delete a partner that still has events",
    );
  }

  const logoImageId = existing.logoImageId;

  await db.delete(partners).where(eq(partners.id, partnerId));

  const { deleteImageRecord } = await catalogImages();
  await deleteImageRecord(db, logoImageId, { skipBucket: options?.skipBucket });
}

export type CountPartnersOptions = {
  q?: string;
};

export async function countPartners(db: Db, options: CountPartnersOptions = {}): Promise<number> {
  const searchCondition = partnerSearchCondition(options.q);

  if (searchCondition) {
    const [result] = await db.select({ count: count() }).from(partners).where(searchCondition);
    return result?.count ?? 0;
  }

  const [result] = await db.select({ count: count() }).from(partners);
  return result?.count ?? 0;
}
