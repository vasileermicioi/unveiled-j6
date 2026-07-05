import { ForgotPassword } from "@better-auth-ui/heroui";

import { AppAuthProvider } from "../components/AppAuthProvider";
import { AuthFormFallback } from "../components/AuthFormFallback";
import type { Locale } from "../lib/locale";
import { useClientMounted } from "./useClientMounted";

type AuthForgotPasswordProps = {
  locale: Locale;
};

export default function AuthForgotPassword({ locale }: AuthForgotPasswordProps) {
  const mounted = useClientMounted();

  if (!mounted) {
    return <AuthFormFallback locale={locale} />;
  }

  return (
    <AppAuthProvider locale={locale}>
      <ForgotPassword className="auth-form" variant="default" />
    </AppAuthProvider>
  );
}
