## ADDED Requirements

### Requirement: Role-based admin route protection

The application SHALL protect `/:locale/admin/*` routes so that only authenticated users with role `ADMIN` can render partner management and dashboard pages introduced in catalog step 03. Users with role `USER` or `PARTNER` SHALL be redirected away from the `admin` path prefix per the established locale middleware pattern. Unauthenticated visitors SHALL be redirected to login with optional `returnTo`. Only `ADMIN` and `USER` login roles are active in Phase 4 catalog step 03; PARTNER provisioning is deferred to Phase 8.

#### Scenario: Admin section requires ADMIN role

- **WHEN** a signed-in USER navigates to `/de/admin/partners`
- **THEN** the request is rejected by redirect to `/de` (or equivalent forbidden handling)

#### Scenario: Unauthenticated admin access redirects to login

- **WHEN** an unauthenticated visitor navigates to `/de/admin`
- **THEN** the browser is redirected to `/de/login` with the admin path preserved for post-login return where supported

#### Scenario: ADMIN can access admin dashboard

- **WHEN** a signed-in ADMIN navigates to `/de/admin`
- **THEN** the dashboard page renders successfully
