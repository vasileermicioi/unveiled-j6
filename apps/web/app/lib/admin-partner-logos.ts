import { buildVariantUrl } from "@unveiled/images/urls";

type PartnerWithOptionalLogo = {
  id: string;
  logoImageId: string | null;
};

export function buildPartnerLogoUrls(
  partners: PartnerWithOptionalLogo[],
): Record<string, string | undefined> {
  const logoUrls: Record<string, string | undefined> = {};

  for (const partner of partners) {
    if (!partner.logoImageId) {
      continue;
    }

    try {
      logoUrls[partner.id] = buildVariantUrl(partner.logoImageId, "small-320.jpg");
    } catch {
      logoUrls[partner.id] = undefined;
    }
  }

  return logoUrls;
}
