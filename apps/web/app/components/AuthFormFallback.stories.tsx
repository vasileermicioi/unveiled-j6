import type { Story } from "@ladle/react";

import { AuthFormFallback } from "./AuthFormFallback";

export const LoadingDe: Story = () => <AuthFormFallback locale="de" />;
LoadingDe.storyName = "AuthFormFallback / Loading (de)";

export const LoadingEn: Story = () => <AuthFormFallback locale="en" />;
LoadingEn.storyName = "AuthFormFallback / Loading (en)";
