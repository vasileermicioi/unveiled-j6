import { buildVariantUrl } from "@unveiled/images/urls";

type PartnerWithLogo = {
  id: string;
  logoImageId: string;
};

export function buildPartnerLogoUrls(
  partners: PartnerWithLogo[],
): Record<string, string | undefined> {
  const logoUrls: Record<string, string | undefined> = {};

  for (const partner of partners) {
    try {
      logoUrls[partner.id] = buildVariantUrl(partner.logoImageId, "small-320.webp");
    } catch {
      logoUrls[partner.id] = undefined;
    }
  }

  return logoUrls;
}
