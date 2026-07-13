import { Card, Heading, Link, Paragraph, Surface } from "@heroui/react";

import ProfileSecuritySettings from "../../islands/ProfileSecuritySettings";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";
import type { ProfileCopy } from "../../lib/profile-content";

export type SecurityPageProps = {
  locale: Locale;
  copy: ProfileCopy;
};

export function SecurityPage({ locale, copy }: SecurityPageProps) {
  const backHref = localizedPath(locale, "profile");

  return (
    <Surface
      className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 md:py-14"
      variant="transparent"
    >
      <Surface className="flex max-w-2xl flex-col gap-3" variant="transparent">
        <Heading level={1}>{copy.securityTitle}</Heading>
        <Paragraph color="muted">{copy.securitySubtitle}</Paragraph>
        <Link className="button button--secondary button--md sm:max-w-xs" href={backHref}>
          {copy.backToProfile}
        </Link>
      </Surface>

      <Card className="mx-auto w-full max-w-2xl">
        <Card.Content>
          <ProfileSecuritySettings locale={locale} />
        </Card.Content>
      </Card>
    </Surface>
  );
}
