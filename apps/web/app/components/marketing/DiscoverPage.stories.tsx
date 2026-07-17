import type { Story } from "@ladle/react";

import type { DiscoverPartnerTile } from "../../lib/catalog-mappers";
import { getPageContent } from "../../lib/content";
import { mockDiscoverPartner, mockEventCardItem, storyLocale } from "../stories/fixtures";
import { DiscoverPage } from "./DiscoverPage";

/** Tiny SVG so Ladle can show a logo cell without network. */
const mockLogoUrl =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="90" viewBox="0 0 160 90"><rect width="160" height="90" fill="#f5f5f5"/><text x="80" y="52" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#111">Logo</text></svg>',
  );

const marqueePartners: DiscoverPartnerTile[] = [
  {
    ...mockDiscoverPartner,
    id: "partner-1",
    name: "Lichtspiel",
    initial: "L",
    logoUrl: mockLogoUrl,
  },
  { id: "partner-2", name: "Kino Babylon", address: "", initial: "K" },
  { id: "partner-3", name: "Radialsystem", address: "", initial: "R", logoUrl: mockLogoUrl },
  { id: "partner-4", name: "Sophiensæle", address: "", initial: "S" },
  { id: "partner-5", name: "Heimathafen", address: "", initial: "H" },
];

const discoverContent = getPageContent(storyLocale, "discover");

/**
 * Reduced-motion is CSS `@media (prefers-reduced-motion: reduce)` on
 * `.discover-partners__track` — toggle the OS/browser setting; not a story prop.
 */
export const Default: Story = () => (
  <DiscoverPage
    content={discoverContent}
    events={[mockEventCardItem]}
    locale={storyLocale}
    partners={[mockDiscoverPartner]}
  />
);
Default.storyName = "DiscoverPage / Default";
Default.meta = {
  description:
    "Partner venues marquee: reduced-motion is CSS @media (prefers-reduced-motion: reduce), not a story prop.",
};

export const Marquee: Story = () => (
  <DiscoverPage
    content={discoverContent}
    events={[mockEventCardItem]}
    locale={storyLocale}
    partners={marqueePartners}
  />
);
Marquee.storyName = "DiscoverPage / Partner marquee";
Marquee.meta = {
  description:
    "Multi-partner logo strip (mix of logo + initial). Continuous CSS marquee; prefers-reduced-motion disables auto-scroll via CSS media — not a story prop.",
};

export const EmptyPartners: Story = () => (
  <DiscoverPage
    content={discoverContent}
    events={[mockEventCardItem]}
    locale={storyLocale}
    partners={[]}
  />
);
EmptyPartners.storyName = "DiscoverPage / Empty partners (section hidden)";
EmptyPartners.meta = {
  description: "Zero partners: Partner venues section is not rendered (no empty marquee).",
};
