import { parseLegacyAddress } from "../location";

/** Bridge free-text fixture addresses into structured create/update inputs. */
export function structuredLocationFromAddress(
  address: string,
  fallbackZip = "10115",
): {
  street: string;
  houseNumber: string;
  addressLine2: string | null;
  zipCode: string;
  country: "DE";
  city: "berlin";
} {
  const parsed = parseLegacyAddress(address);
  return {
    street: parsed.street,
    houseNumber: parsed.houseNumber,
    addressLine2: parsed.addressLine2,
    zipCode: parsed.zipCode ?? fallbackZip,
    country: "DE",
    city: "berlin",
  };
}
