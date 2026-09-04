import type { Story } from "@ladle/react";

import { getPageContent } from "../../../lib/content";
import { landingFallbackTeasers } from "../../../lib/content/landing-v3";
import { LandingPageV3 } from "./LandingPageV3";

const contentDe = getPageContent("de", "landing");
const contentEn = getPageContent("en", "landing");

const fullRailDe = landingFallbackTeasers.de.slice(0, 3);
const fullRailEn = landingFallbackTeasers.en.slice(0, 3);
const shortRailDe = landingFallbackTeasers.de.slice(0, 1);
const shortRailEn = landingFallbackTeasers.en.slice(0, 1);

export const FullRailDe: Story = () => (
  <LandingPageV3 content={contentDe} locale="de" teasers={fullRailDe} />
);
FullRailDe.storyName = "LandingPageV3 / Full rail (DE)";

export const FullRailEn: Story = () => (
  <LandingPageV3 content={contentEn} locale="en" teasers={fullRailEn} />
);
FullRailEn.storyName = "LandingPageV3 / Full rail (EN)";

export const ShortRailDe: Story = () => (
  <LandingPageV3 content={contentDe} locale="de" teasers={shortRailDe} />
);
ShortRailDe.storyName = "LandingPageV3 / Short rail (DE)";

export const ShortRailEn: Story = () => (
  <LandingPageV3 content={contentEn} locale="en" teasers={shortRailEn} />
);
ShortRailEn.storyName = "LandingPageV3 / Short rail (EN)";

export const EmptyRailDe: Story = () => (
  <LandingPageV3 content={contentDe} locale="de" teasers={[]} />
);
EmptyRailDe.storyName = "LandingPageV3 / Empty rail (DE)";

export const EmptyRailEn: Story = () => (
  <LandingPageV3 content={contentEn} locale="en" teasers={[]} />
);
EmptyRailEn.storyName = "LandingPageV3 / Empty rail (EN)";
