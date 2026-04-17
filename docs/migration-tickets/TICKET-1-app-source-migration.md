# TICKET-1: Migrate App Source Code from JavaScript to TypeScript

**Type:** Story
**Priority:** High
**Story Points:** 13
**Labels:** typescript-migration, tech-debt

## Description
Migrate all remaining `.js` and `.jsx` files under the `app/` directory to `.ts`/`.tsx`. The repository is already partially migrated with TypeScript configured (`tsconfig.json` has `strict: true` and `allowJs: true`). This ticket covers ~250 `.js` files and ~12 `.jsx` files in the application source code.

### Scope
- **Actions** (~11 files): `app/actions/alert/`, `app/actions/bookmarks/`, `app/actions/browser/`, `app/actions/collectibles/`, `app/actions/infuraAvailability/`, `app/actions/modals/`, `app/actions/notification/`, `app/actions/privacy/`, `app/actions/settings/`, `app/actions/transaction/`, `app/actions/wizard/`
- **Reducers** (~12 files): `app/reducers/alert/`, `app/reducers/bookmarks/`, `app/reducers/browser/`, `app/reducers/collectibles/`, `app/reducers/infuraAvailability/`, `app/reducers/modals/`, `app/reducers/notification/`, `app/reducers/privacy/`, `app/reducers/settings/`, `app/reducers/swaps/`, `app/reducers/transaction/`, `app/reducers/wizard/`
- **Constants & Utils** (~30 files): `app/constants/navigation.js`, `app/constants/network.js`, `app/util/ENSUtils.js`, `app/util/blockies.js`, `app/util/confirm-tx.js`, `app/util/conversion/index.js`, `app/util/custom-gas/index.js`, `app/util/device/index.js`, `app/util/networks/index.js`, `app/util/transactions/index.js`, etc.
- **Core Modules** (~25 files): `app/core/BackgroundBridge/BackgroundBridge.js`, `app/core/NotificationManager.js`, `app/core/SecureKeychain.js`, `app/core/Vault.js`, `app/core/WalletConnect/WalletConnect.js`, `app/core/RPCMethods/` directory, etc.
- **UI Components** (~100 files): All remaining `.js` files under `app/components/Base/`, `app/components/UI/`, `app/components/Views/`, `app/components/Nav/`
- **JSX Files** (~12 files): All `.jsx` files under `app/components/Views/confirmations/legacy/` → `.tsx`
- **Store Migrations** (~30 files): `app/store/migrations/000.js` through `027.js`
- **Mocks & Test Utils** (~15 files): `app/__mocks__/*.js`, `app/util/test/*.js`
- **Locales & Lib** : `locales/i18n.js`, `app/lib/ens-ipfs/` files, `app/lib/ppom/blockaid-version.js`, `app/images/image-icons.js`

### Migration Guidelines
- Rename `.js` → `.ts`, `.jsx` → `.tsx`
- Replace `PropTypes` with TypeScript interfaces
- Add type annotations to function parameters, return types, and state shapes
- Define action type interfaces and reducer state types
- Use `unknown` instead of `any` where possible; `@typescript-eslint/no-explicit-any` is set to `error` in `.eslintrc.js`
- For complex untyped third-party interactions, use type assertions with a TODO comment

### Files to NOT touch (must remain JS)
- `index.js` (React Native entry point)
- `shim.js`

## Acceptance Criteria
- [ ] All `.js` and `.jsx` files under `app/` are renamed to `.ts`/`.tsx`
- [ ] All files have proper type annotations (no implicit `any`)
- [ ] `PropTypes` imports are removed and replaced with TypeScript interfaces
- [ ] `npx tsc --noEmit` passes with no errors
- [ ] All existing unit tests pass (`yarn test`)
- [ ] ESLint passes with no new errors
