import { Card, Chip, Heading, Link } from "@heroui/react";

import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";
import type { ProfileCopy } from "../../lib/profile-content";

import { ProfileLayout } from "./ProfileLayout";

export type ProfilePageProps = {
  locale: Locale;
  copy: ProfileCopy;
  credits: number;
};

export function ProfilePage({ locale, copy, credits }: ProfilePageProps) {
  const membershipHref = localizedPath(locale, "membership");

  return (
    <ProfileLayout activeTab="wallet" eyebrow={copy.eyebrow} headline={copy.title} locale={locale}>
      <Card className="mx-auto w-full max-w-2xl">
        <Card.Header className="flex flex-col gap-4">
          <Heading level={2}>{copy.walletTitle}</Heading>
          <Chip variant="tertiary">
            <Chip.Label>{copy.walletBalance(credits)}</Chip.Label>
          </Chip>
          <Link className="button button--primary button--md sm:max-w-xs" href={membershipHref}>
            {copy.refillCta}
          </Link>
        </Card.Header>
      </Card>
    </ProfileLayout>
  );
}
