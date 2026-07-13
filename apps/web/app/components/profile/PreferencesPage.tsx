import { Card, Heading, Link, Paragraph, Surface } from "@heroui/react";
import type { UserProfile } from "@unveiled/db";

import ProfilePreferencesForm from "../../islands/ProfilePreferencesForm";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";
import type { ProfileCopy } from "../../lib/profile-content";

export type PreferencesPageProps = {
  locale: Locale;
  copy: ProfileCopy;
  profile: UserProfile;
  error?: string | null;
  success?: string | null;
};

export function PreferencesPage({
  locale,
  copy,
  profile,
  error = null,
  success = null,
}: PreferencesPageProps) {
  const action = localizedPath(locale, "profile/preferences");
  const backHref = localizedPath(locale, "profile");

  return (
    <Surface
      className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 md:py-14"
      variant="transparent"
    >
      <Surface className="flex max-w-2xl flex-col gap-3" variant="transparent">
        <Heading level={1}>{copy.preferencesTitle}</Heading>
        <Paragraph color="muted">{copy.preferencesSubtitle}</Paragraph>
        <Link className="button button--secondary button--md sm:max-w-xs" href={backHref}>
          {copy.backToProfile}
        </Link>
      </Surface>

      <Card className="onboarding-card mx-auto w-full max-w-2xl">
        <Card.Content className="flex flex-col gap-6">
          {error ? <Paragraph>{error}</Paragraph> : null}
          {success ? <Paragraph>{success}</Paragraph> : null}
          <ProfilePreferencesForm action={action} copy={copy} locale={locale} profile={profile} />
        </Card.Content>
      </Card>
    </Surface>
  );
}
