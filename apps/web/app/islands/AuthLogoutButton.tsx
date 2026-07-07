import { signOut } from "../lib/auth-client";

type AuthLogoutButtonProps = {
  label: string;
  className?: string;
};

export default function AuthLogoutButton({ label, className }: AuthLogoutButtonProps) {
  return (
    <button
      className={className ?? "button button--secondary button--md"}
      onClick={() => {
        void signOut();
      }}
      type="button"
    >
      {label}
    </button>
  );
}
