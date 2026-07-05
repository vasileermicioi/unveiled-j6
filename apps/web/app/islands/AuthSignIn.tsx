import { SignIn } from "@better-auth-ui/heroui";

import { AppAuthProvider } from "../components/AppAuthProvider";
import { AuthFormFallback } from "../components/AuthFormFallback";
import type { Locale } from "../lib/locale";
import { useClientMounted } from "./useClientMounted";

type AuthSignInProps = {
  locale: Locale;
};

export default function AuthSignIn({ locale }: AuthSignInProps) {
  const mounted = useClientMounted();

  if (!mounted) {
    return <AuthFormFallback locale={locale} />;
  }

  return (
    <AppAuthProvider locale={locale}>
      <SignIn className="auth-form" variant="default" />
    </AppAuthProvider>
  );
}
