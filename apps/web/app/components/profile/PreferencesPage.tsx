import { Card, Paragraph } from "@heroui/react";
import type { UserProfile } from "@unveiled/db";

import ProfilePreferencesForm from "../../islands/ProfilePreferencesForm";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";
import type { ProfileCopy } from "../../lib/profile-content";

import { ProfileLayout } from "./ProfileLayout";

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

  return (
    <ProfileLayout
      activeTab="preferences"
      eyebrow={copy.eyebrow}
      headline={copy.preferencesTitle}
      locale={locale}
    >
      <Card className="onboarding-card w-full">
        <Card.Content className="flex flex-col gap-6">
          {error ? <Paragraph>{error}</Paragraph> : null}
          {success ? <Paragraph>{success}</Paragraph> : null}
          <ProfilePreferencesForm action={action} copy={copy} locale={locale} profile={profile} />
        </Card.Content>
      </Card>
    </ProfileLayout>
  );
}
