import { ResetPassword } from "@better-auth-ui/heroui";

import { AppAuthProvider } from "../components/AppAuthProvider";
import { AuthFormFallback } from "../components/AuthFormFallback";
import type { Locale } from "../lib/locale";
import { useClientMounted } from "./useClientMounted";

type AuthResetPasswordProps = {
  locale: Locale;
};

export default function AuthResetPassword({ locale }: AuthResetPasswordProps) {
  const mounted = useClientMounted();

  if (!mounted) {
    return <AuthFormFallback locale={locale} />;
  }

  return (
    <AppAuthProvider locale={locale}>
      <ResetPassword className="auth-form" variant="default" />
    </AppAuthProvider>
  );
}
