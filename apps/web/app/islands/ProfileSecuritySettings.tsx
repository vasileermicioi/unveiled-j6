import { ChangePassword } from "@better-auth-ui/heroui";

import { AppAuthProvider } from "../components/AppAuthProvider";
import type { Locale } from "../lib/locale";
import { useClientMounted } from "./useClientMounted";

type ProfileSecuritySettingsProps = {
  locale: Locale;
};

export default function ProfileSecuritySettings({ locale }: ProfileSecuritySettingsProps) {
  const mounted = useClientMounted();

  if (!mounted) {
    return null;
  }

  return (
    <AppAuthProvider locale={locale}>
      <ChangePassword className="auth-form" />
    </AppAuthProvider>
  );
}
