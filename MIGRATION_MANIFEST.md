# TypeScript Migration Manifest

> Auto-generated audit of remaining `.js`/`.jsx` files in the MetaMask Mobile repository.
> Total: **822 JS/JSX files** (~115,884 lines) to convert.
> Already TypeScript: **3,931 TS/TSX files** in `app/` alone.

---

## Summary by Agent Assignment

| Agent | Domain | Files | Lines | Directories |
|-------|--------|------:|------:|-------------|
| **Devin A** | Redux Layer | 63 | ~4,613 | `app/actions/`, `app/reducers/`, `app/selectors/`, `app/store/` |
| **Devin B** | Core Engine & Controllers | 24 | ~4,687 | `app/core/` |
| **Devin C** | Utilities & Libraries | 36 | ~7,910 | `app/util/`, `app/lib/` |
| **Devin D** | UI Components: Views | 80 | ~32,821 | `app/components/Views/` |
| **Devin E** | UI Components: UI | 103 | ~31,416 | `app/components/UI/` |
| **Devin F** | Nav, Hooks, Base | 15 | ~4,086 | `app/components/Nav/`, `app/components/hooks/`, `app/components/Base/` |
| **Devin G** | Component Library | 0 | 0 | `app/component-library/` (already TS) |
| **Devin H** | Test Infrastructure | 480 | ~29,248 | `e2e/`, `wdio/` |
| **Devin I** | Config & Root Files | 11 | ~871 | `scripts/`, `locales/`, root config files |
| **Devin J** | Constants & Images | 4 | ~183 | `app/constants/`, `app/images/` |
| | **Root config files** | 10 | ~1,051 | `*.js` at repo root |

---

## Devin A — Redux Layer (63 files, ~4,613 lines)

### `app/actions/` (11 files, 618 lines)
All action creator files that need conversion.

### `app/reducers/` (14 files, 1,657 lines)
Redux reducer files. `index.ts` already defines `RootState` but many individual reducers are JS.

### `app/store/` (38 files, 2,338 lines)
Store configuration and migration files. `index.ts` and `persistConfig.ts` are already TS.
Many files under `app/store/migrations/` are JS.

### Key deliverables:
- Strongly-typed `RootState` (replace `any` types in existing `RootState` interface)
- Ensure `useAppSelector` and `useAppDispatch` from `app/types/redux.ts` are used
- Type all action creators with explicit action types

---

## Devin B — Core Engine & Controllers (24 files, ~4,687 lines)

### `app/core/` (24 JS files among 454 TS files)
The Engine is already mostly TypeScript. Remaining JS files include:
- `BackgroundBridge/BackgroundBridge.js`
- `RPCMethods/` JS files
- `SDKConnect/` remaining JS files
- Other controller helpers

### Key deliverables:
- Ensure all exported type signatures are stable and well-documented
- These files are heavily imported — type changes here affect many consumers

---

## Devin C — Utilities & Libraries (36 files, ~7,910 lines)

### `app/util/` (32 files, 7,462 lines)
Includes large files like:
- `transactions/index.js` (1,658 lines)
- `number/index.js` (939 lines)
- `networks/index.js` and related

### `app/lib/` (4 files, 448 lines)

### Key deliverables:
- Add generic types where utilities are polymorphic
- These are leaf dependencies — converting them early unblocks other agents

---

## Devin D — UI Components: Views (80 files, ~32,821 lines)

### `app/components/Views/` breakdown:
- `confirmations/` (37 files, ~17,426 lines) — **largest subdirectory**
- `Settings/` (8 files, ~5,280 lines)
- `ChoosePassword/` (778 lines)
- `ResetPassword/` (816 lines)
- `Browser/` (513 lines)
- Other view components

### Key deliverables:
- Type all navigation route params
- Type all props interfaces
- Consider splitting `confirmations/` to a sub-agent if needed

---

## Devin E — UI Components: UI (103 files, ~31,416 lines)

### `app/components/UI/` breakdown (largest subdirectories):
- `Swaps/` (23 files, ~7,888 lines) — includes `QuotesView.js` (2,676 lines)
- `TransactionElement/` (4 files, ~2,574 lines)
- `Navbar/` (2 files, ~2,095 lines)
- `DrawerView/` (1,299 lines)
- `EditGasFee1559/` (1,006 lines)
- `Transactions/` (962 lines)
- `Notification/` (5 files, 924 lines)
- `PaymentRequest/` (906 lines)
- Many smaller component directories

### Key deliverables:
- Ensure prop interfaces are exported for consumers
- Remove all `PropTypes` (148 files across the app use PropTypes)

---

## Devin F — Nav, Hooks, Base (15 files, ~4,086 lines)

### `app/components/Nav/` (3 files, 2,079 lines)
- `Main/MainNavigator.js` (911 lines) — central navigation
- Other navigation files

### `app/components/Base/` (12 files, 2,007 lines)
- Various base components

### `app/components/hooks/` (0 JS files — already TS)

### Key deliverables:
- Type all custom hook return values explicitly
- Navigation components need typed param lists

---

## Devin G — Component Library (0 JS files)

`app/component-library/` is **already fully TypeScript**. No work needed.

---

## Devin H — Test Infrastructure (480 files, ~29,248 lines)

### `e2e/` (356 files, 22,858 lines)
- `fixtures/fixture-builder.js` (1,098 lines) — largest file
- Detox test specs and helpers

### `wdio/` (124 files, 6,390 lines)
- WebDriverIO test files and page objects

### Key deliverables:
- Add `tsconfig.json` for test directories (extending root config)
- Type page objects and test utilities
- Some test files may need to stay as JS for tooling compatibility — document why

---

## Devin I — Configuration & Root Files (11 files + 10 root configs)

### `scripts/` (8 files, 645 lines)
### `locales/` (3 files, 226 lines)

### Root-level config files (10 files, 1,051 lines):
| File | Lines | Notes |
|------|------:|-------|
| `wdio.conf.js` | 474 | May need to stay JS |
| `metro.transform.js` | 154 | Must stay JS (Metro requires it) |
| `index.js` | 105 | React Native entry point — must stay JS |
| `shim.js` | 86 | Polyfills — must stay JS |
| `metro.config.js` | 60 | Must stay JS (Metro requires it) |
| `babel.config.js` | 59 | Must stay JS (Babel requires it) |
| `jest.config.js` | 56 | Can convert to `.ts` with `ts-jest` |
| `app.config.js` | 23 | Expo config — may stay JS |
| `babel.config.tests.js` | 22 | Must stay JS |
| `react-native.config.js` | 12 | Must stay JS |

### Key deliverables:
- Document which config files must remain as `.js` and why
- Convert what can be converted

---

## Devin J — Constants & Images (4 files, ~183 lines)

### `app/constants/` (3 files, 125 lines)
### `app/images/` (1 file, 58 lines)

### Key deliverables:
- Quick conversion
- Add type definitions for localization keys if feasible
- Sweep for any `.js`/`.jsx` files not covered by other agents

---

## Existing Infrastructure

| Item | Status |
|------|--------|
| `tsconfig.json` | ✔ Exists with `strict: true`, `allowJs: true` |
| `RootState` type | ✔ Exists in `app/reducers/index.ts` (many fields still `any`) |
| `ReduxStore` type | ✔ Exists in `app/core/redux/types.ts` |
| `useAppSelector` / `useAppDispatch` | ✔ Created in `app/types/redux.ts` (Phase 0) |
| Ambient declarations | ✔ `app/declarations/index.d.ts` (411 lines) |
| CI type checking | ✔ `yarn lint:tsc` runs `tsc --project ./tsconfig.json` in CI |
| PropTypes usage | 148 files still import `prop-types` |
| `lint:tsc` CI job | ✔ Runs in `.github/workflows/ci.yml` |
