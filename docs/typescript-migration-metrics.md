# TypeScript Migration Metrics - Baseline

**Baseline Date:** 2026-02-12

## File Counts (`app/` directory)

| File Type | Count |
|-----------|-------|
| `.js`     | 321   |
| `.jsx`    | 12    |
| **Total JavaScript** | **333** |
| `.ts`     | 2,404 |
| `.tsx`    | 1,528 |
| **Total TypeScript** | **3,932** |
| **Grand Total** | **4,265** |

## Conversion Progress

| Metric | Value |
|--------|-------|
| TypeScript files | 3,932 |
| JavaScript files | 333 |
| **Percentage converted** | **92.2%** |

## `any` Type Usage

| Metric | Count |
|--------|-------|
| Files with `eslint-disable @typescript-eslint/no-explicit-any` | 399 |
| Files with `TODO: Replace any` comments | 347 |
| Total `: any` annotations in `app/` | 538 |

A prominent example is `app/reducers/index.ts` (lines 56-127), where the `RootState` interface has 14 properties typed as `any` with `TODO: Replace "any" with type` comments.

## TypeScript Compiler Diagnostics

Running `yarn lint:tsc` (which executes `tsc --project ./tsconfig.json`) completes **with 0 type errors**.

The project uses `strict: true` in `tsconfig.json` with `allowJs: true`, `noEmit: true`, and `skipLibCheck: true`. The TypeScript compiler is configured for `esnext` target with `commonjs` modules and `react-native` JSX.

## Key Configuration

- **tsconfig.json**: Strict mode enabled, `allowJs: true` permits gradual migration
- **.eslintrc.js**: `@typescript-eslint/no-explicit-any` set to `error` for `.ts`/`.tsx` files
- **Fitness function**: `.github/scripts/fitness-functions/rules/javascript-additions.test.ts` prevents new `.js`/`.jsx` files from being added to the `app/` directory
- **Dependency checker**: `yarn circular:deps` uses `dpdm` to detect circular dependencies

## JavaScript Files by Directory (Top Concentrations)

| Directory | JS File Count |
|-----------|--------------|
| `app/store/migrations/` | 38 |
| `app/components/UI/Swaps/components/` | 14 |
| `app/util/` | 13 |
| `app/core/` | 10 |
| `app/util/test/` | 8 |
| `app/components/Base/Keypad/` | 7 |
| `app/core/RPCMethods/` | 6 |
| `app/__mocks__/` | 6 |
| `app/components/UI/Swaps/utils/` | 5 |
| `app/components/Views/NavigationUnitTest/` | 4 |
| `app/components/Base/` | 4 |

## E2E Test Files

| File Type | Count |
|-----------|-------|
| JavaScript (`.js`/`.jsx`) in `e2e/` | 356 |
| TypeScript (`.ts`/`.tsx`) in `e2e/` | 4 |

The `e2e/` directory represents a large pool of unconverted JavaScript files that can be migrated independently from the core app.
