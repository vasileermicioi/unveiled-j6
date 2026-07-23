import { Surface } from "@heroui/react";
import type { ReactNode } from "react";

import type { Locale } from "../../lib/locale";
import { PageSectionHeader } from "../marketing/PageSectionHeader";

import { ProfileTabNav } from "./ProfileTabNav";
import type { ProfileTab } from "./profile-tabs";

type ProfileLayoutProps = {
  locale: Locale;
  activeTab: ProfileTab;
  eyebrow: string;
  headline: string;
  children: ReactNode;
};

export function ProfileLayout({
  locale,
  activeTab,
  eyebrow,
  headline,
  children,
}: ProfileLayoutProps) {
  return (
    <Surface
      className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-10 sm:px-6 md:py-14 lg:px-8"
      variant="transparent"
    >
      <ProfileTabNav activeTab={activeTab} locale={locale} />
      <Surface className="flex w-full flex-col gap-6" variant="transparent">
        <PageSectionHeader eyebrow={eyebrow} headline={headline} />
        {children}
      </Surface>
    </Surface>
  );
}
