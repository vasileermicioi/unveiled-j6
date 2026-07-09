import { Heading, Paragraph, Surface } from "@heroui/react";
import type { ReactNode } from "react";

import { type AuthPageKey, getAuthPageCopy } from "../lib/auth-content";
import type { Locale } from "../lib/locale";

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
      <Surface className="mx-auto flex w-full max-w-lg flex-col gap-6" variant="transparent">
        <Surface className="flex flex-col gap-3" variant="transparent">
          <Heading level={1}>{copy.title}</Heading>
          <Paragraph color="muted">{copy.description}</Paragraph>
        </Surface>
        {children}
      </Surface>
    </Surface>
  );
}
