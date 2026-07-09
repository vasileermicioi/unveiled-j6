import { Card, Heading, Paragraph, Surface } from "@heroui/react";
import type { ReactNode } from "react";

import type { Locale } from "../../lib/locale";
import type { OnboardingStepKey } from "../../lib/onboarding-content";
import { getOnboardingCopy, getOnboardingStepMeta } from "../../lib/onboarding-content";

import { OnboardingStepIndicator } from "./OnboardingStepIndicator";

type OnboardingLayoutProps = {
  locale: Locale;
  step: OnboardingStepKey;
  children: ReactNode;
  error?: string | null;
};

export function OnboardingLayout({ locale, step, children, error = null }: OnboardingLayoutProps) {
  const shared = getOnboardingCopy(locale);
  const meta = getOnboardingStepMeta(locale, step);

  return (
    <Surface
      className="mx-auto flex w-full max-w-7xl flex-col px-4 py-10 md:py-14"
      variant="transparent"
    >
      <Card className="onboarding-card mx-auto w-full max-w-2xl">
        <Card.Header className="flex flex-col gap-6">
          <OnboardingStepIndicator locale={locale} step={meta.stepNumber} />
          <Surface className="flex flex-col gap-3" variant="transparent">
            <Heading level={1}>{shared.title}</Heading>
            <Paragraph color="muted">{shared.subtitle}</Paragraph>
          </Surface>
        </Card.Header>

        <Card.Content className="flex flex-col gap-6">
          {error ? <Paragraph>{error}</Paragraph> : null}
          {children}
        </Card.Content>
      </Card>
    </Surface>
  );
}
