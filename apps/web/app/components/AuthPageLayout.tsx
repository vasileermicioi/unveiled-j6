import { Paragraph, Surface } from "@heroui/react";
import type { ReactNode } from "react";

import { type AuthPageKey, getAuthPageCopy } from "../lib/auth-content";
import type { Locale } from "../lib/locale";
import { PageSectionHeader } from "./marketing/PageSectionHeader";

type AuthPageLayoutProps = {
  locale: Locale;
  page: AuthPageKey;
  children: ReactNode;
};

export function AuthPageLayout({ locale, page, children }: AuthPageLayoutProps) {
  const copy = getAuthPageCopy(locale, page);

  return (
    <Surface
      className="mx-auto flex w-full max-w-7xl flex-col px-4 py-10 md:py-14"
      variant="transparent"
    >
      <Surface
        className="auth-page__column mx-auto flex w-full flex-col gap-6"
        variant="transparent"
      >
        <Surface className="flex flex-col gap-3" variant="transparent">
          <PageSectionHeader eyebrow={copy.eyebrow} headline={copy.title} />
          <Paragraph color="muted">{copy.description}</Paragraph>
        </Surface>
        {children}
      </Surface>
    </Surface>
  );
}
