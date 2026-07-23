import { Card, Link, Paragraph } from "@heroui/react";

import type { GdprMemberCopy } from "../../lib/gdpr-content";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

import { ProfileLayout } from "./ProfileLayout";

export type DataExportPageProps = {
  locale: Locale;
  copy: GdprMemberCopy;
};

export function DataExportPage({ locale, copy }: DataExportPageProps) {
  const downloadHref = `${localizedPath(locale, "profile/data-export")}?download=1`;

  return (
    <ProfileLayout
      activeTab="data-export"
      eyebrow={copy.eyebrow}
      headline={copy.exportTitle}
      locale={locale}
    >
      <Card className="w-full">
        <Card.Content className="flex flex-col gap-6">
          <Paragraph>{copy.exportSubtitle}</Paragraph>
          <Link className="button button--primary button--md sm:max-w-xs" href={downloadHref}>
            {copy.exportDownload}
          </Link>
        </Card.Content>
      </Card>
    </ProfileLayout>
  );
}
