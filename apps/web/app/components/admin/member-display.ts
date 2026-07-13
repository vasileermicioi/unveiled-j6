import type { UserProfile } from "@unveiled/db";

export function memberDisplayName(profile: UserProfile | null | undefined, email: string): string {
  const first = profile?.first_name?.trim() ?? "";
  const last = profile?.last_name?.trim() ?? "";
  const name = `${first} ${last}`.trim();
  return name || email;
}
