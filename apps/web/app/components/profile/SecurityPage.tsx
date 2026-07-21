import { Card } from "@heroui/react";

import ProfileSecuritySettings from "../../islands/ProfileSecuritySettings";
import type { Locale } from "../../lib/locale";
import type { ProfileCopy } from "../../lib/profile-content";

import { ProfileLayout } from "./ProfileLayout";

export type SecurityPageProps = {
  locale: Locale;
  copy: ProfileCopy;
};

export function SecurityPage({ locale, copy }: SecurityPageProps) {
  return (
    <ProfileLayout
      activeTab="security"
      eyebrow={copy.eyebrow}
      headline={copy.securityTitle}
      locale={locale}
    >
      <Card className="mx-auto w-full max-w-2xl">
        <Card.Content>
          <ProfileSecuritySettings locale={locale} />
        </Card.Content>
      </Card>
    </ProfileLayout>
  );
}
