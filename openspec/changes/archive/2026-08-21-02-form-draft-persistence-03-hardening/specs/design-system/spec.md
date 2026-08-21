## ADDED Requirements

### Requirement: Add/edit forms persist unsaved drafts

SSR create and edit forms SHALL opt into the shared browser `localStorage` draft helper (`apps/web/app/lib/form-draft.ts`): restore after refresh, skip raw `File` inputs, clear on successful persist POST, and offer Discard. Search, delete-confirm, one-shot ops (freeze/refund/comp-ticket), GET filters, Better Auth, and member onboarding/profile forms are exempt. Product design-system Form controls and `AGENTS.md` SHALL state this rule and cite the helper.

#### Scenario: Docs name the helper

- **WHEN** an agent reads `docs/product/ui/design-system.md` Form controls
- **THEN** it states that add/edit forms persist unsaved values via the shared localStorage helper
- **AND** it cites `form-draft.ts` / `FormDraftPersistence`
- **AND** it names the exemptions (search, delete-confirm, auth)

#### Scenario: AGENTS.md states the hard rule

- **WHEN** an agent reads `AGENTS.md` Hard rules
- **THEN** a numbered rule requires SSR add/edit forms to persist unsaved values in `localStorage` via the shared helper
- **AND** it states restore on load/refresh, skip `File` inputs, clear on successful persist, and Discard
