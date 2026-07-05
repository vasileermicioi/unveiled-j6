import { Button } from "@heroui/react";

import { signOut } from "../lib/auth-client";

type AuthLogoutButtonProps = {
  label: string;
  className?: string;
};

export default function AuthLogoutButton({ label, className }: AuthLogoutButtonProps) {
  return (
    <Button
      className={className ?? "button button--secondary button--md"}
      onPress={() => {
        void signOut();
      }}
      type="button"
    >
      {label}
    </Button>
  );
}
