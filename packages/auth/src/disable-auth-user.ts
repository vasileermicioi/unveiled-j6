/**
 * Neon Auth credential disable collaborator for GDPR anonymization.
 *
 * Prefer Better Auth / Neon Auth Admin `remove-user` (or `neonctl neon-auth user delete`)
 * so the real email does not remain in `neon_auth`. Fallback when remove is unavailable:
 * Admin `ban-user` plus wipe Auth email to the same placeholder as `public.users`
 * (`deleted-{userId}@deleted.local`).
 *
 * Concrete HTTP against `AUTH_URL` is wired in `apps/web` (gdpr-rights-02). This package
 * only re-exports the injectable type used by `@unveiled/db` `anonymizeUserAccount`.
 *
 * Ops notes for DEPLOYMENT / step 02:
 * - Enable Neon Auth Admin plugin if using ban/remove-user APIs.
 * - Admin plugin calls typically need an Auth-side admin session (Console “Make admin”).
 * - Self-service delete may use Neon’s current-user delete API when available.
 */
export type { DisableAuthUserFn } from "@unveiled/db";
