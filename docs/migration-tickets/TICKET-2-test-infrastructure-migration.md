# TICKET-2: Migrate E2E and WDIO Test Files from JavaScript to TypeScript

**Type:** Story
**Priority:** Medium
**Story Points:** 8
**Labels:** typescript-migration, tech-debt, testing

## Description
Migrate all remaining `.js` test infrastructure files under `e2e/` (~200+ files) and `wdio/` (~80+ files) directories to TypeScript.

### Scope

#### E2E Tests (~200+ files)
- `e2e/pages/**/*.js` → `.ts`
- `e2e/selectors/**/*.js` → `.ts`
- `e2e/specs/**/*.spec.js` → `.spec.ts`
- `e2e/utils/*.js` → `.ts`
- `e2e/fixtures/*.js` → `.ts`
- `e2e/helpers.js` → `.ts`
- `e2e/init.js` → `.ts`
- `e2e/tags.js` → `.ts`
- `e2e/environment.js` → `.ts`
- `e2e/api-mocking/**/*.js` → `.ts`
- `e2e/api-specs/**/*.js` → `.ts`

#### WDIO Tests (~80+ files)
- `wdio/config/*.js` → `.ts`
- `wdio/helpers/*.js` → `.ts`
- `wdio/screen-objects/**/*.js` → `.ts`
- `wdio/step-definitions/*.js` → `.ts`
- `wdio/utils/*.js` → `.ts`

### Migration Guidelines
- Rename `.js` → `.ts`
- Add type annotations to page objects, helper functions, and test utilities
- Type Detox/WDIO API calls and selectors
- Ensure test runner configurations support `.ts` files (may need `ts-jest` or similar)

### Files to NOT touch
- `wdio.conf.js` (WDIO config file, expected to be JS)
- `.detoxrc.js` (Detox config file, expected to be JS)

## Acceptance Criteria
- [ ] All `.js` files under `e2e/` are renamed to `.ts`
- [ ] All `.js` files under `wdio/` are renamed to `.ts`
- [ ] Type annotations added to page objects, helpers, and utilities
- [ ] E2E test suite runs successfully
- [ ] WDIO test suite runs successfully
- [ ] `npx tsc --noEmit` passes with no errors related to these files
