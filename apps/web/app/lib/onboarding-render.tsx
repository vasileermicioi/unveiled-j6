import type { OnboardingStep } from "@unveiled/auth";
import type { UserProfile } from "@unveiled/db";
import type { Context } from "hono";

import { OnboardingStepPage } from "../components/onboarding/OnboardingStepPage";
import type { Locale } from "./locale";
import { getOnboardingCopy } from "./onboarding-content";

export function renderOnboardingStepPage(
  c: Context,
  options: {
    locale: Locale;
    step: OnboardingStep;
    profile: UserProfile;
    error?: string | null;
  },
) {
  const pathname = new URL(c.req.url).pathname;
  const copy = getOnboardingCopy(options.locale);

  return c.render(
    <OnboardingStepPage
      error={options.error ?? null}
      locale={options.locale}
      profile={options.profile}
      step={options.step}
    />,
    {
      locale: options.locale,
      title: copy.title,
      description: copy.subtitle,
      canonicalPath: pathname,
      robots: "noindex",
    },
  );
}
