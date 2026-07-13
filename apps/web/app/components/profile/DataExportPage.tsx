import { Card, Heading, Link, Paragraph, Surface } from "@heroui/react";

import type { GdprMemberCopy } from "../../lib/gdpr-content";
import type { Locale } from "../../lib/locale";
import { localizedPath } from "../../lib/locale";

export type DataExportPageProps = {
  locale: Locale;
  copy: GdprMemberCopy;
};

export function DataExportPage({ locale, copy }: DataExportPageProps) {
  const backHref = localizedPath(locale, "profile");
  const downloadHref = `${localizedPath(locale, "profile/data-export")}?download=1`;

  return (
    <Surface
      className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10 md:py-14"
      variant="transparent"
    >
      <Surface className="flex max-w-2xl flex-col gap-3" variant="transparent">
        <Heading level={1}>{copy.exportTitle}</Heading>
        <Paragraph color="muted">{copy.exportSubtitle}</Paragraph>
        <Link href={backHref}>{copy.exportBack}</Link>
      </Surface>

      <Card className="mx-auto w-full max-w-2xl">
        <Card.Content className="flex flex-col gap-6">
          <Link className="button button--primary button--md sm:max-w-xs" href={downloadHref}>
            {copy.exportDownload}
          </Link>
        </Card.Content>
      </Card>
    </Surface>
  );
}
