import { SignUp } from "@better-auth-ui/heroui";

import { AppAuthProvider } from "../components/AppAuthProvider";
import { AuthFormFallback } from "../components/AuthFormFallback";
import type { Locale } from "../lib/locale";
import { useClientMounted } from "./useClientMounted";

type AuthSignUpProps = {
  locale: Locale;
};

export default function AuthSignUp({ locale }: AuthSignUpProps) {
  const mounted = useClientMounted();

  if (!mounted) {
    return <AuthFormFallback locale={locale} />;
  }

  return (
    <AppAuthProvider locale={locale}>
      <SignUp className="auth-form" variant="default" />
    </AppAuthProvider>
  );
}
