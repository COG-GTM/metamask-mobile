# TypeScript Migration — Jira Task Breakdown

> **Purpose:** This document is a copy-paste-ready breakdown of the JS→TS migration epic for `chase-cog-ai/metamask-mobile`. Each section maps to a Jira issue (Epic / Story / Sub-task). Acceptance Criteria are written in **Gherkin** (`Given / When / Then`) so they can be lifted directly into ticket bodies and reused for QA / BDD test cases.
>
> **Format per ticket:** Title, Priority, Description, Acceptance Criteria (Gherkin), File Paths, Dependencies.

---

## Migration Guidelines (apply to every story and sub-task)

- One PR per file, or per tightly-coupled group (e.g. a reducer + its action pair).
- **No large batch conversions.** A 37-file batch PR (#11214) was reverted in PR #11418 — do not repeat that pattern.
- Each PR must keep all existing tests green (`yarn test --findRelatedTests <file>`).
- Each PR must pass `tsc --noEmit` and `yarn lint`.
- Each PR must pass the CI fitness function in `.github/scripts/fitness-functions/common/constants.ts`, which already blocks new JS files in `app/` via the regex `^(app).*\.(js|jsx)$`.
- Migrations are **type-only** changes — do not refactor logic, do not convert `connect()` HOCs to hooks, and preserve preprocessor directives like `///: BEGIN:ONLY_INCLUDE_IF(...)` exactly.
- Snapshot tests must produce identical output before and after migration.

---

## Epic: Complete JavaScript to TypeScript Migration

- **Issue type:** Epic
- **Priority:** P1
- **Description:** Approximately 244 `.js`/`.jsx` files remain in the `app/` directory. CI already blocks the introduction of any new JS files in `app/` via the fitness function in `.github/scripts/fitness-functions/common/constants.ts`. The goal of this epic is to drive the `app/` directory to **100% TypeScript** so we can enable stricter compiler and lint settings, eliminate `any` from `RootState`, and remove the carve-outs in `tsconfig.json` and `.eslintrc.js`.
- **Scope:** All remaining `.js`/`.jsx` source and test files under `app/` plus the TypeScript / lint configuration tightening that becomes possible once they are gone.
- **Out of scope:** Behavioral refactors, hook conversions of existing `connect()` HOCs, build pipeline changes (`tsconfig.json` already has `"strict": true` and `"allowJs": true`; `jest.config.js` already transforms both `.js` and `.ts`).

### Epic-level Acceptance Criteria (Gherkin)

```gherkin
Feature: Complete TypeScript migration of the app/ directory

  Scenario: No JavaScript files remain under app/
    Given the migration epic has been completed
    When I run `find app -type f \( -name "*.js" -o -name "*.jsx" \)`
    Then the command should return zero results

  Scenario: CI fitness function continues to block new JS files
    Given the fitness function regex APP_FOLDER_JS_REGEX is unchanged
    When a contributor opens a PR that adds a new `.js` or `.jsx` file under app/
    Then CI must fail on the "TypeScript app gate" check

  Scenario: RootState contains zero `any` fields
    Given all reducers under app/reducers/ have been migrated to TypeScript
    When I open app/reducers/index.ts
    Then the RootState interface should contain no `any` typed fields
    And the surrounding eslint-disable @typescript-eslint/no-explicit-any comments should be removed

  Scenario: Stricter TS compiler options are enabled
    Given Story 7 has been completed
    When I open tsconfig.json
    Then noUnusedLocals, noUnusedParameters, noImplicitReturns, and noFallthroughCasesInSwitch should all be enabled

  Scenario: Existing test suite still passes
    Given the migration epic has been completed
    When CI runs `yarn test`
    Then all unit tests should pass with no new failures attributable to the migration
```

---

## Story 1: Convert Redux Reducers & Actions to TypeScript

- **Issue type:** Story
- **Priority:** P0
- **Parent:** Epic — Complete JavaScript to TypeScript Migration
- **Estimated files:** 23 source files (12 reducers + 11 actions) plus the `RootState` cleanup in `app/reducers/index.ts`.
- **Dependencies:** None.
- **Dependency of:** Story 4 (UI Components), Story 5 (View Screens), Story 7 (Strictness).
- **Description:** Convert each Redux reducer and its paired action creators to TypeScript, defining a discriminated-union `Action` type per module and exporting a `State` interface from each reducer. Once all reducers expose typed `State` interfaces, replace every `any` field in `RootState` (`app/reducers/index.ts`, lines 56–127) with the proper type and re-enable the `StateFromReducersMapObject` approach noted in the TODO at lines 53–55.

### Story 1 Acceptance Criteria (Gherkin)

```gherkin
Feature: Redux reducers and actions are fully typed

  Scenario: Every reducer file is TypeScript
    Given Story 1 is complete
    When I list app/reducers/*/index.*
    Then every reducer module should be a `.ts` file and no `.js` file should remain

  Scenario: Every action file is TypeScript
    Given Story 1 is complete
    When I list app/actions/*/index.*
    Then every action module should be a `.ts` file and no `.js` file should remain

  Scenario: RootState has no `any` fields
    Given all reducer migrations are merged
    When I open app/reducers/index.ts
    Then the RootState interface should contain zero `any` typed fields
    And the surrounding `eslint-disable @typescript-eslint/no-explicit-any` directives should be removed

  Scenario: Type checker is clean
    Given Story 1 is complete
    When I run `yarn tsc --noEmit`
    Then it should exit with status 0

  Scenario: No test regressions
    Given Story 1 is complete
    When I run `yarn test`
    Then all reducer- and action-related test suites should pass
```

### Story 1 — Sub-tasks

Each sub-task is a separate Jira ticket. Convention:

- **Title:** `Convert <slice> reducer + action to TypeScript`
- **Priority:** P0
- **Parent:** Story 1
- **Description:** Rename the listed `.js` files to `.ts`, add typed action creators (with `as const` action-type constants and a discriminated-union `Action` type), define and export a `State` interface from the reducer, and consume the typed `Action` union in the reducer signature.

#### Sub-task template ACs (Gherkin) — apply to **every** sub-task in Story 1

```gherkin
Feature: <slice> slice is fully typed

  Scenario: Files renamed to TypeScript
    Given the sub-task PR is merged
    When I look at the file paths listed in this sub-task
    Then each `.js` file should now exist as `.ts` (no `.js` counterpart should remain)

  Scenario: Reducer exports a State interface
    Given the reducer for <slice> is migrated
    When I import the reducer module
    Then it should export a named `State` interface (or a slice-specific name like `<Slice>State`)
    And the interface should match the shape of `initialState`

  Scenario: Actions form a discriminated union
    Given the action module for <slice> is migrated
    When I import the action module
    Then it should export action-type string constants declared with `as const`
    And it should export an `Action` (or `<Slice>Action`) discriminated-union type
    And each action creator should have explicitly typed parameters and return type

  Scenario: Reducer consumes the typed action union
    Given the reducer is migrated
    When I view the reducer signature
    Then it should be typed as `(state: <Slice>State = initialState, action: <Slice>Action): <Slice>State`

  Scenario: Type checker and tests pass
    Given the sub-task PR is opened
    When CI runs `tsc --noEmit`, `yarn lint`, and `yarn test --findRelatedTests <files>`
    Then all three should pass
```

| #  | Sub-task title                                                | Files                                                                                                |
|----|---------------------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1  | Convert `alert` reducer + action to TypeScript                | `app/reducers/alert/index.js`, `app/actions/alert/index.js`                                          |
| 2  | Convert `bookmarks` reducer + action to TypeScript            | `app/reducers/bookmarks/index.js`, `app/actions/bookmarks/index.js`                                  |
| 3  | Convert `browser` reducer + action to TypeScript              | `app/reducers/browser/index.js`, `app/actions/browser/index.js`                                      |
| 4  | Convert `collectibles` reducer + action to TypeScript         | `app/reducers/collectibles/index.js`, `app/actions/collectibles/index.js`                            |
| 5  | Convert `infuraAvailability` reducer + action to TypeScript   | `app/reducers/infuraAvailability/index.js`, `app/actions/infuraAvailability/index.js`                |
| 6  | Convert `modals` reducer + action to TypeScript               | `app/reducers/modals/index.js`, `app/actions/modals/index.js`                                        |
| 7  | Convert `notification` reducer + action to TypeScript         | `app/reducers/notification/index.js`, `app/actions/notification/index.js`                            |
| 8  | Convert `privacy` reducer + action to TypeScript              | `app/reducers/privacy/index.js`, `app/actions/privacy/index.js`                                      |
| 9  | Convert `settings` reducer + action to TypeScript             | `app/reducers/settings/index.js`, `app/actions/settings/index.js`                                    |
| 10 | Convert `swaps` reducer to TypeScript                         | `app/reducers/swaps/index.js` (no action pair)                                                       |
| 11 | Convert `transaction` reducer + action to TypeScript          | `app/reducers/transaction/index.js`, `app/actions/transaction/index.js`                              |
| 12 | Convert `wizard` reducer + action to TypeScript               | `app/reducers/wizard/index.js`, `app/actions/wizard/index.js`                                        |

#### Sub-task 13: Replace `any` types in `RootState` and enable `StateFromReducersMapObject`

- **Files:** `app/reducers/index.ts` (lines 53–127)
- **Depends on:** Sub-tasks 1–12 above must be merged first.
- **Description:** Remove every `// TODO: Replace "any" with type` block in the `RootState` interface and replace each `any` field with the corresponding `State` interface (or `StateFromReducer<typeof reducer>`) imported from the now-typed reducer modules. Then enable the `StateFromReducersMapObject` approach described in the comment at lines 53–55.

```gherkin
Feature: RootState is fully typed without `any`

  Scenario: RootState contains no `any`
    Given sub-tasks 1–12 are merged
    When I open app/reducers/index.ts
    Then the RootState interface should contain zero `any` typed fields
    And every `// TODO: Replace "any" with type` comment in this file should be removed
    And every `eslint-disable @typescript-eslint/no-explicit-any` directive in this file should be removed

  Scenario: StateFromReducersMapObject is leveraged
    Given the migration of all reducers is complete
    When I view app/reducers/index.ts
    Then RootState should be derivable from the `reducers` map object using `StateFromReducersMapObject` (or equivalent)
    And the inline TODO at the top of the RootState section should be removed

  Scenario: Type checker is clean
    Given sub-task 13 is complete
    When I run `yarn tsc --noEmit`
    Then it should exit with status 0
```

---

## Story 2: Convert Core Utility Modules to TypeScript

- **Issue type:** Story
- **Priority:** P1
- **Parent:** Epic — Complete JavaScript to TypeScript Migration
- **Estimated files:** ~23 files in `app/core/`.
- **Dependencies:** None hard, but Story 1 should land first so reducers that core modules touch are typed.
- **Description:** Convert remaining JS modules under `app/core/` to TypeScript. These include singletons, native-bridge wrappers, and middleware stacks — handle them in order of complexity (constants first, native-bridge last) and type singletons explicitly. For native modules without published types, add inline `declare module` declarations rather than `any`.

### Story 2 Acceptance Criteria (Gherkin)

```gherkin
Feature: Core services and singletons are fully typed

  Scenario: No JS files remain under app/core/
    Given Story 2 is complete
    When I run `find app/core -type f \( -name "*.js" -o -name "*.jsx" \)`
    Then the command should return zero results

  Scenario: Native modules have explicit type declarations
    Given Story 2 is complete
    When I open the migrated SecureKeychain, PreventScreenshot, and BackgroundBridge files
    Then each native-module reference should be backed by a `declare module` block or an explicit interface
    And no `any` should be used to silence the native module's typing

  Scenario: Preprocessor directives are preserved
    Given Story 2 is complete
    When I diff each migrated file against its previous JS version
    Then any `///: BEGIN:ONLY_INCLUDE_IF(...)` and `///: END:ONLY_INCLUDE_IF` markers should be byte-identical

  Scenario: Type checker, lint, and tests pass
    Given Story 2 is complete
    When CI runs `tsc --noEmit`, `yarn lint`, and `yarn test`
    Then all three should pass
```

### Story 2 — Key files

- `app/core/BackgroundBridge/BackgroundBridge.js`
- `app/core/SecureKeychain.js`
- `app/core/NotificationManager.js`
- `app/core/Vault.js`
- `app/core/RPCMethods/index.js` and sub-files
- `app/core/Permissions/specifications.js`
- `app/core/ClipboardManager.js`
- `app/core/DrawerStatusTracker.js`
- `app/core/EntryScriptWeb3.js`
- `app/core/MobilePortStream.js`
- `app/core/PreventScreenshot.js`
- `app/core/TransactionTypes.js`
- `app/core/WalletConnect.js`

---

## Story 3: Convert Shared Utility Functions to TypeScript

- **Issue type:** Story
- **Priority:** P1
- **Parent:** Epic — Complete JavaScript to TypeScript Migration
- **Estimated files:** ~31 files in `app/util/`.
- **Dependencies:** None.
- **Description:** Convert remaining `.js` modules in `app/util/` to `.ts`, adding parameter and return type annotations to every exported function. Where helpers accept flexible inputs (e.g. `timestamp` as `number | string`), check actual call sites to determine the correct union type rather than falling back to `any`.

### Story 3 Acceptance Criteria (Gherkin)

```gherkin
Feature: Shared utility functions are fully typed

  Scenario: No JS files remain under app/util/
    Given Story 3 is complete
    When I run `find app/util -type f \( -name "*.js" -o -name "*.jsx" \)`
    Then the command should return zero results

  Scenario: Every exported function has explicit parameter and return types
    Given a migrated util module
    When I inspect each `export` declaration
    Then every parameter should have an explicit type
    And every function should have an explicit return type
    And `any` should not appear except where annotated with a justifying comment

  Scenario: Type checker, lint, and tests pass
    Given Story 3 is complete
    When CI runs `tsc --noEmit`, `yarn lint`, and `yarn test --findRelatedTests <files>`
    Then all three should pass
```

### Story 3 — Key files

- `app/util/networks/index.js`
- `app/util/transactions/index.js`
- `app/util/conversion/index.js`
- `app/util/number/index.js`
- `app/util/general/index.js`
- `app/util/ENSUtils.js`
- `app/util/confirm-tx.js`
- `app/util/custom-gas/index.js`
- `app/util/gasUtils.js`
- `app/util/device/index.js`
- `app/util/blockies.js`
- `app/util/date/index.js`
- `app/util/etherscan.js`
- `app/util/middlewares.js`
- `app/util/payment-link-generator.js`
- `app/util/scaling.js`
- `app/util/streams.js`
- `app/util/walletconnect.js`
- `app/util/sentry/utils.js`

---

## Story 4: Convert Legacy UI Components to TypeScript

- **Issue type:** Story
- **Priority:** P2
- **Parent:** Epic — Complete JavaScript to TypeScript Migration
- **Estimated files:** ~95 files under `app/components/UI/`.
- **Dependencies:** Story 1 (typed `RootState` is needed for `connect()` components).
- **Description:** Convert legacy `.js`/`.jsx` files under `app/components/UI/` to `.tsx`. Replace `PropTypes` with TypeScript interfaces, define `OwnProps` / `StateProps` / `DispatchProps` for `connect()`-based components, and type navigation props using `StackNavigationProp` and `RouteProp`. Keep `connect()` HOCs — do not refactor to hooks during migration.

### Story 4 Acceptance Criteria (Gherkin)

```gherkin
Feature: Legacy UI components are fully typed

  Scenario: No JS or JSX files remain under app/components/UI/
    Given Story 4 is complete
    When I run `find app/components/UI -type f \( -name "*.js" -o -name "*.jsx" \)`
    Then the command should return zero results

  Scenario: PropTypes have been replaced with TS interfaces
    Given a migrated UI component
    When I open the component file
    Then it should not import `prop-types`
    And props should be typed via a named TypeScript interface

  Scenario: connect() components are typed with three prop interfaces
    Given a migrated `connect()`-based component
    When I read its source
    Then it should declare `OwnProps`, `StateProps`, and `DispatchProps` interfaces
    And `mapStateToProps` should be typed as `(state: RootState): StateProps`
    And `mapDispatchToProps` should be typed accordingly

  Scenario: Snapshot parity
    Given a migrated UI component has snapshot tests
    When I run those snapshot tests
    Then the rendered output should match the existing snapshots without updates
```

### Story 4 — Sub-task groupings

Each sub-task should be its own Jira ticket and inherit the Story 4 ACs above (specialized to the area in scope).

| #  | Sub-task title                                              | Approx. files | Scope                                                                                  |
|----|-------------------------------------------------------------|---------------|----------------------------------------------------------------------------------------|
| 1  | Migrate `app/components/UI/Swaps/` to TypeScript            | ~20           | All files under `app/components/UI/Swaps/`                                             |
| 2  | Migrate transaction UI components to TypeScript             | ~10           | `TransactionElement/`, `Transactions/`, and related `app/components/UI/` siblings      |
| 3  | Migrate navigation UI to TypeScript                         | ~8            | `Navbar/`, `Tabs/`, `BrowserBottomBar/`                                                |
| 4  | Migrate `app/components/UI/Notification/` to TypeScript     | 4             | All files under `app/components/UI/Notification/`                                      |
| 5  | Migrate remaining `app/components/UI/` one-offs             | ~50           | `DrawerView`, `PaymentRequest`, `StyledButton`, `TokenImage`, `EditGasFee*`, `CollectibleContracts`, etc. |

---

## Story 5: Convert Legacy View Screens to TypeScript

- **Issue type:** Story
- **Priority:** P2
- **Parent:** Epic — Complete JavaScript to TypeScript Migration
- **Estimated files:** ~70 files under `app/components/Views/`.
- **Dependencies:** Story 1 (typed `RootState`); benefits from Stories 2–4 landing first.
- **Description:** Convert legacy `.js`/`.jsx` files under `app/components/Views/` to `.tsx`. For class components, define `Props` and `State` interfaces. Type route params using `RouteProp<RootStackParamList, 'ScreenName'>`. Pay special attention to the legacy confirmations flow — transaction objects should be typed using `TransactionMeta` from `@metamask/transaction-controller`.

### Story 5 Acceptance Criteria (Gherkin)

```gherkin
Feature: Legacy view screens are fully typed

  Scenario: No JS or JSX files remain under app/components/Views/
    Given Story 5 is complete
    When I run `find app/components/Views -type f \( -name "*.js" -o -name "*.jsx" \)`
    Then the command should return zero results

  Scenario: Class components have typed Props and State
    Given a migrated class component view
    When I open the component
    Then it should extend `Component<Props, State>` (or `PureComponent<Props, State>`)
    And both `Props` and `State` should be declared as named interfaces

  Scenario: Navigation params are typed
    Given a migrated screen
    When I view its `route` and `navigation` prop types
    Then they should be typed via `RouteProp<RootStackParamList, 'ScreenName'>` and `StackNavigationProp<RootStackParamList, 'ScreenName'>` respectively

  Scenario: Legacy confirmation transactions use TransactionMeta
    Given a migrated file under app/components/Views/confirmations/legacy/
    When I see references to a transaction object
    Then the transaction should be typed using `TransactionMeta` from `@metamask/transaction-controller`

  Scenario: No test regressions
    Given Story 5 is complete
    When CI runs `yarn test`
    Then all view-related tests should pass
```

### Story 5 — Sub-task groupings

Each sub-task should be its own Jira ticket and inherit the Story 5 ACs above (specialized to the area in scope).

| #  | Sub-task title                                                   | Approx. files | Scope                                                                                |
|----|------------------------------------------------------------------|---------------|--------------------------------------------------------------------------------------|
| 1  | Migrate legacy confirmations to TypeScript                       | ~25           | `app/components/Views/confirmations/legacy/` (Approval, Approve, SendFlow, etc.)     |
| 2  | Migrate onboarding flow to TypeScript                            | ~10           | `Onboarding/`, `ChoosePassword/`, `ManualBackupStep*`                                |
| 3  | Migrate settings screens to TypeScript                           | ~10           | `Settings/AdvancedSettings/`, `Settings/GeneralSettings/`, `Settings/Contacts/`, `Settings/NetworksSettings/`, etc. |
| 4  | Migrate Browser views to TypeScript                              | ~5            | `app/components/Views/Browser/`                                                      |
| 5  | Migrate send flow & approvals to TypeScript                      | ~10           | `SendFlow/`, `Approval/`, `Approve/`                                                 |
| 6  | Migrate remaining view screens to TypeScript                     | ~10           | `ActivityView`, `AccountBackupStep1`, `Asset`, `Collectible`, `LockScreen`, etc.     |

---

## Story 6: Convert Old Store Migrations to TypeScript

- **Issue type:** Story
- **Priority:** P3
- **Parent:** Epic — Complete JavaScript to TypeScript Migration
- **Estimated files:** ~28 source files (`000.js`–`027.js`) plus 9 existing test files (`019.test.js`–`027.test.js`). Migration `028+` is already TypeScript and serves as the reference pattern.
- **Dependencies:** None.
- **Description:** Rename each `app/store/migrations/00x.js` (and matching `.test.js`) to `.ts`, type the migrate function as `(state: unknown) => Record<string, unknown>`, and use `isObject` / `hasProperty` from `@metamask/utils` to narrow the state shape. Use migration `028.ts` as the reference pattern.

### Story 6 Acceptance Criteria (Gherkin)

```gherkin
Feature: Old store migrations are fully typed

  Scenario: All migration source files are TypeScript
    Given Story 6 is complete
    When I list app/store/migrations/
    Then no `*.js` source files (000–027) should remain
    And no `*.test.js` migration test files should remain

  Scenario: Migrate functions have a typed signature
    Given a migrated file in app/store/migrations/
    When I open the file
    Then `export default function migrate` should be typed as `(state: unknown): Record<string, unknown>`

  Scenario: State narrowing uses @metamask/utils
    Given a migrated file
    When state is accessed
    Then access should be guarded by `isObject` and `hasProperty` from `@metamask/utils`
    Or the narrowing should be performed via an explicit type assertion that includes a comment explaining the expected shape

  Scenario: Migration pipeline tests pass
    Given Story 6 is complete
    When I run `yarn test app/store/migrations/index.test.ts`
    Then the migration pipeline test should pass
```

---

## Story 7: Tighten TypeScript Strictness and Lint Configuration

- **Issue type:** Story
- **Priority:** P1
- **Parent:** Epic — Complete JavaScript to TypeScript Migration
- **Dependencies:** Story 1 (no `any` in `RootState`); benefits from all other stories landing first to minimize fallout.
- **Description:** Once the codebase is fully TypeScript and `RootState` is fully typed, enable the stricter compiler options that are currently commented out in `tsconfig.json` (lines 31–35), enable the `@metamask/eslint-config` extend block currently commented out in `.eslintrc.js` (line 11), and audit and reduce the count of `@ts-ignore`, `@ts-expect-error`, and `eslint-disable @typescript-eslint/no-explicit-any` directives across the codebase.

### Story 7 Acceptance Criteria (Gherkin)

```gherkin
Feature: Stricter TypeScript and lint configuration is enabled

  Scenario: Stricter compiler options are enabled
    Given Story 7 is complete
    When I open tsconfig.json
    Then the following options should be present and uncommented under "compilerOptions":
      | option                     | value |
      | noUnusedLocals             | true  |
      | noUnusedParameters         | true  |
      | noImplicitReturns          | true  |
      | noFallthroughCasesInSwitch | true  |

  Scenario: @metamask/eslint-config is extended
    Given Story 7 is complete
    When I open .eslintrc.js
    Then "@metamask/eslint-config" should appear (uncommented) in the top-level `extends` array
    And the surrounding `// TODO: Enable when ready` comment should be removed

  Scenario: RootState contains no `any`
    Given Story 7 depends on Story 1
    When I open app/reducers/index.ts
    Then the RootState interface should contain zero `any` fields

  Scenario: @ts-ignore / @ts-expect-error usage has been audited
    Given Story 7 is complete
    When I run `git grep -E "(@ts-ignore|@ts-expect-error)" -- 'app/**'`
    Then the count of matches should be strictly lower than the count measured at Story 7 kickoff
    And every remaining occurrence should be accompanied by a comment explaining why it is necessary

  Scenario: Type checker, lint, and tests pass under the new config
    Given Story 7 is complete
    When CI runs `tsc --noEmit`, `yarn lint`, and `yarn test`
    Then all three should pass
```

### Story 7 — Sub-tasks

| # | Sub-task title                                                                 | Files                                                                                  |
|---|--------------------------------------------------------------------------------|----------------------------------------------------------------------------------------|
| 1 | Enable stricter compiler options in `tsconfig.json`                            | `tsconfig.json` (lines 31–35, currently commented out)                                  |
| 2 | Enable `@metamask/eslint-config` in `.eslintrc.js`                             | `.eslintrc.js` (line 11, currently commented out with `// TODO: Enable when ready`)    |
| 3 | Audit and reduce `@ts-ignore` / `@ts-expect-error` / `no-explicit-any` usage  | Codebase-wide; track before/after counts in the PR description                         |

---

## Appendix A — How to Bulk-Create These Tickets in Jira

You can either copy each section above into Jira's "Bulk create issues" CSV importer, or create them manually:

1. Create the Epic first (`Complete JavaScript to TypeScript Migration`).
2. For each Story, create it under the Epic and copy the corresponding section's Title, Priority, Description, Files, Dependencies, and Gherkin ACs into the body.
3. For each Sub-task, create it under its Story and copy the row from the table plus the inherited Gherkin ACs (the "Sub-task template ACs" block for Story 1; the Story-level ACs for Stories 4 and 5).

## Appendix B — Reference Migration Patterns

- Reducers: `app/reducers/security/index.ts`
- Actions: `app/actions/onboarding/index.ts`
- Store migrations: `app/store/migrations/028.ts`
- RPC methods: `app/core/RPCMethods/RPCMethodMiddleware.ts`
- Core services: `app/core/Authentication/Authentication.ts`, `app/core/Encryptor/Encryptor.ts`
- UI components: any component under `app/component-library/components/`
- View components: `app/components/Views/Wallet/index.tsx`, `app/components/Views/Login/index.tsx`
