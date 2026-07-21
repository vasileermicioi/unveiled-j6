import type { Story } from "@ladle/react";

import { AuthFormFallback } from "./AuthFormFallback";
import { AuthPageLayout } from "./AuthPageLayout";
import { storyLocale } from "./stories/fixtures";

export const Login: Story = () => (
  <AuthPageLayout locale={storyLocale} page="login">
    <AuthFormFallback locale={storyLocale} />
  </AuthPageLayout>
);
Login.storyName = "AuthPageLayout / Login";

export const Signup: Story = () => (
  <AuthPageLayout locale={storyLocale} page="signup">
    <AuthFormFallback locale={storyLocale} />
  </AuthPageLayout>
);
Signup.storyName = "AuthPageLayout / Signup";
