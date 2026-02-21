# JavaScript to TypeScript Migration Test Harness Plan

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Current State Analysis](#current-state-analysis)
3. [Test Harness Components](#test-harness-components)
   - [Component 1: Migration Progress Tracker](#component-1-migration-progress-tracker)
   - [Component 2: Type Quality Gate](#component-2-type-quality-gate)
   - [Component 3: `any` Type Regression Guard](#component-3-any-type-regression-guard)
   - [Component 4: `@ts-ignore` / `@ts-expect-error` Regression Guard](#component-4-ts-ignore--ts-expect-error-regression-guard)
   - [Component 5: Migration Quality Scorecard](#component-5-migration-quality-scorecard)
4. [Integration with Existing Infrastructure](#integration-with-existing-infrastructure)
5. [Implementation Roadmap](#implementation-roadmap)
6. [Appendix: Current Migration Snapshot](#appendix-current-migration-snapshot)

---

## Executive Summary

This document outlines a test harness strategy that extends the existing fitness function infrastructure in `metamask-mobile` to comprehensively support and validate the ongoing JavaScript to TypeScript migration. The harness is designed around five components:

| # | Component | Purpose |
|---|-----------|---------|
| 1 | Migration Progress Tracker | Measure and report the JS-to-TS conversion ratio over time |
| 2 | Type Quality Gate | Block PRs that introduce new `any`-typed code in TypeScript files |
| 3 | `any` Type Regression Guard | Ensure the total count of `any` usages decreases (or stays flat) over time |
| 4 | `@ts-ignore` / `@ts-expect-error` Regression Guard | Prevent growth of type-suppression directives |
| 5 | Migration Quality Scorecard | Generate a per-PR and per-build summary of migration health metrics |

All components are designed to plug into the existing fitness-function framework (`.github/scripts/fitness-functions/`) and the CI pipeline (`.github/workflows/fitness-functions.yml` and `.github/workflows/ci.yml`).

---

## Current State Analysis

### File Counts (as of baseline)

| Metric | Count |
|--------|-------|
| `.js` files in `app/` | 321 |
| `.jsx` files in `app/` | 12 |
| **Total JavaScript files** | **333** |
| `.ts` files in `app/` | 2,404 |
| `.tsx` files in `app/` | 1,528 |
| **Total TypeScript files** | **3,932** |
| **Migration progress** | **~92.2% TypeScript** |

### Type Quality Indicators

| Metric | Count | Notes |
|--------|-------|-------|
| Files with `: any` type annotations | ~270 | TypeScript files using explicit `any` |
| `eslint-disable @typescript-eslint/no-explicit-any` comments | ~399 | Inline suppression of the `any` rule |
| `TODO: Replace "any" with type` comments | ~341 | Tracked technical debt markers |
| `@ts-ignore` / `@ts-expect-error` directives | ~121 | Type-checking suppressions |

### Directories with Most Remaining JS Files

| Directory | JS File Count |
|-----------|--------------|
| `app/store/migrations/` | 38 |
| `app/components/UI/Swaps/components/` | 14 |
| `app/util/` | 13 |
| `app/core/` | 10 |
| `app/util/test/` | 8 |
| `app/components/Base/Keypad/` | 7 |
| `app/core/RPCMethods/` | 6 |

### Existing Safeguards

1. **Fitness Function: `preventJavaScriptFileAdditions`** (`.github/scripts/fitness-functions/rules/javascript-additions.ts`)
   - Blocks creation of new `.js` / `.jsx` files inside `app/`.
   - Runs on every PR via `.github/workflows/fitness-functions.yml`.

2. **ESLint Rule: `@typescript-eslint/no-explicit-any`** set to `error` for `*.ts` / `*.tsx` files (`.eslintrc.js` line 37).
   - Enforced via `yarn lint` in CI (`ci.yml` scripts matrix).

3. **TypeScript Strict Mode** (`tsconfig.json` line 24): `"strict": true`.
   - Enforced via `yarn lint:tsc` in CI.

4. **Code Coverage Thresholds** (`coverage-thresholds.json`): statements 41.5%, branches 33.4%, functions 32.5%, lines 41.9%.

---

## Test Harness Components

### Component 1: Migration Progress Tracker

**Goal**: Automatically measure and report the JS-to-TS file ratio on every PR, and fail if the ratio regresses (i.e., new JS files are added).

#### Design

Create a new fitness function rule: `migration-progress.ts`.

```
.github/scripts/fitness-functions/rules/
  migration-progress.ts
  migration-progress.test.ts
```

#### Behavior

1. **Count** all `.js`, `.jsx`, `.ts`, and `.tsx` files under `app/` (excluding test utilities, mocks, and auto-generated files).
2. **Compute** the migration percentage: `tsFiles / (tsFiles + jsFiles) * 100`.
3. **Report** the percentage as a console log in CI output.
4. **Fail** if the percentage has _decreased_ compared to a stored baseline (see below).

#### Baseline Storage

Store the current baseline in a JSON file at the repo root:

```jsonc
// migration-baseline.json
{
  "jsFiles": 333,
  "tsFiles": 3932,
  "migrationPercentage": 92.2,
  "anyCount": 399,
  "tsIgnoreCount": 121,
  "lastUpdated": "2026-02-21"
}
```

The fitness function reads this file, computes the current state from the filesystem, and compares. The baseline is updated manually or via a scheduled CI job after each release.

#### Integration

- Add as a new rule in `.github/scripts/fitness-functions/rules/index.ts` alongside `preventJavaScriptFileAdditions` and `preventCodeBlocksRule`.
- Since this rule needs filesystem access (not just diff), it will use a different function signature. Extend the `IRule` interface:

```typescript
interface IRule {
  name: string;
  fn: (diff: string) => boolean;
  fnFilesystem?: () => boolean; // New: for rules that inspect the filesystem
  docURL?: string;
}
```

The runner in `index.ts` would call `fnFilesystem()` if present, in addition to `fn(diff)`.

#### Test Cases (`migration-progress.test.ts`)

| Test | Expected |
|------|----------|
| Current TS percentage >= baseline percentage | PASS |
| Current TS percentage < baseline percentage | FAIL |
| Baseline file missing | WARN + PASS (graceful degradation) |

---

### Component 2: Type Quality Gate

**Goal**: Prevent PRs from introducing _new_ `any` type annotations in TypeScript files.

#### Design

Create a new fitness function rule: `prevent-new-any-types.ts`.

```
.github/scripts/fitness-functions/rules/
  prevent-new-any-types.ts
  prevent-new-any-types.test.ts
```

#### Behavior

1. Parse the git diff (same input as existing fitness functions).
2. Filter to only `.ts` and `.tsx` files in the diff.
3. For each diff hunk, examine **addition lines** (lines starting with `+`).
4. Check if any addition line contains a new `any` type annotation that is _not_ accompanied by the existing `// TODO: Replace "any" with type` comment pattern.
5. **Fail** if new unaccompanied `any` annotations are found.

#### Detection Patterns

The rule should detect these patterns in added lines:

```typescript
// These should FAIL (new any without TODO marker):
const foo: any = ...
function bar(param: any): any { ... }
as any
<any>
Record<string, any>
Array<any>
Promise<any>

// These should PASS (existing sanctioned pattern):
// TODO: Replace "any" with type
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const foo: any = ...
```

#### Regex Approach

```typescript
// Match lines that contain `: any`, `as any`, `<any>`, etc.
const ANY_TYPE_REGEX = /:\s*any\b|as\s+any\b|<any>|<any,|,\s*any>/;

// Match the sanctioned TODO comment
const SANCTIONED_ANY_REGEX = /TODO:\s*Replace\s*"any"\s*with\s*type/;
```

For each added line matching `ANY_TYPE_REGEX`, check if the preceding line (also in the diff) contains `SANCTIONED_ANY_REGEX` or `eslint-disable.*no-explicit-any`. If neither is present, fail.

#### Test Cases (`prevent-new-any-types.test.ts`)

| Test | Input | Expected |
|------|-------|----------|
| No `any` in diff | Clean TS additions | PASS |
| `any` with TODO comment | `// TODO: Replace "any"...` + `const x: any` | PASS |
| `any` without TODO comment | `const x: any = 5;` | FAIL |
| `any` in JS file (not TS) | `.js` file with `any` | PASS (only checks TS) |
| Modification removing `any` | Deletion of `any` line | PASS |

#### Shared Utilities

Reuse `filterDiffFileCreations` and `filterDiffLineAdditions` from `.github/scripts/fitness-functions/common/shared.ts`. If needed, add a new utility:

```typescript
function filterDiffByFileExtension(diff: string, extensions: string[]): string {
  // Filter diff blocks to only include files matching the given extensions
}
```

---

### Component 3: `any` Type Regression Guard

**Goal**: Track the total count of `any` type usages across the codebase and prevent regressions.

#### Design

This is a **CI-only metric** (not a diff-based fitness function) that runs as a standalone script.

```
scripts/
  migration/
    count-any-types.ts
```

#### Behavior

1. Use `grep` / `ripgrep` to count occurrences of `eslint-disable.*no-explicit-any` across all `.ts` and `.tsx` files in `app/`.
2. Compare the count to the baseline stored in `migration-baseline.json` (`anyCount` field).
3. **Fail** if the count has increased beyond a configurable tolerance (e.g., +0 tolerance = strict, +5 tolerance = lenient during active development).
4. **Log** the delta for visibility.

#### CI Integration

Add as a new script entry in `package.json`:

```json
{
  "scripts": {
    "migration:check-any-count": "ts-node scripts/migration/count-any-types.ts"
  }
}
```

Add to the CI `scripts` matrix in `.github/workflows/ci.yml`:

```yaml
strategy:
  matrix:
    scripts:
      - lint
      - lint:tsc
      - audit:ci
      - test:depcheck
      - test:tgz-check
      - migration:check-any-count   # NEW
```

#### Updating the Baseline

When `any` counts are intentionally reduced (e.g., after a batch migration PR), update `migration-baseline.json`:

```bash
yarn migration:update-baseline
```

This script recalculates all metrics and writes them to `migration-baseline.json`.

---

### Component 4: `@ts-ignore` / `@ts-expect-error` Regression Guard

**Goal**: Prevent growth of type-suppression escape hatches.

#### Design

Similar to Component 3, but tracks `@ts-ignore` and `@ts-expect-error` directives.

This can be combined into the same script (`scripts/migration/count-any-types.ts` renamed to `scripts/migration/migration-metrics.ts`) or implemented as a separate fitness function rule.

**Recommended approach**: Implement as a diff-based fitness function rule to catch new additions in PRs.

```
.github/scripts/fitness-functions/rules/
  prevent-ts-ignore-additions.ts
  prevent-ts-ignore-additions.test.ts
```

#### Behavior

1. Parse the git diff.
2. Filter to `.ts` and `.tsx` files.
3. In addition lines, detect `@ts-ignore` or `@ts-expect-error`.
4. **Fail** if new `@ts-ignore` directives are found in the diff. `@ts-expect-error` may be allowed with justification (it's the preferred directive since it will auto-fail when the underlying issue is fixed).

#### Policy Recommendation

| Directive | Policy |
|-----------|--------|
| `@ts-ignore` | **Block** - never allow new instances |
| `@ts-expect-error` | **Warn** - allow with justification comment |

#### Test Cases

| Test | Input | Expected |
|------|-------|----------|
| No suppression directives | Clean diff | PASS |
| New `@ts-ignore` | `// @ts-ignore` in added line | FAIL |
| New `@ts-expect-error` with comment | `// @ts-expect-error - reason` | WARN + PASS |
| Removal of `@ts-ignore` | Deleted line with `@ts-ignore` | PASS |

---

### Component 5: Migration Quality Scorecard

**Goal**: Generate a human-readable summary of migration health metrics on every PR, posted as a CI artifact or PR comment.

#### Design

```
scripts/
  migration/
    migration-scorecard.ts
```

#### Output Format

The scorecard produces a Markdown summary:

```markdown
## Migration Scorecard

| Metric | Current | Baseline | Delta | Status |
|--------|---------|----------|-------|--------|
| TypeScript files | 3,935 | 3,932 | +3 | :arrow_up: |
| JavaScript files | 330 | 333 | -3 | :arrow_down: |
| Migration % | 92.3% | 92.2% | +0.1% | :white_check_mark: |
| `any` type usages | 395 | 399 | -4 | :white_check_mark: |
| `@ts-ignore` count | 120 | 121 | -1 | :white_check_mark: |
| `@ts-expect-error` count | 45 | 45 | 0 | :heavy_minus_sign: |
| TODO: Replace any | 337 | 341 | -4 | :white_check_mark: |

### Top JS Directories Remaining
| Directory | Files |
|-----------|-------|
| `app/store/migrations/` | 38 |
| `app/components/UI/Swaps/components/` | 14 |
| `app/util/` | 13 |
```

#### CI Integration Options

**Option A: GitHub Actions Job Summary** (recommended)

Write the scorecard to `$GITHUB_STEP_SUMMARY` in the CI workflow:

```yaml
- name: Generate migration scorecard
  run: |
    yarn migration:scorecard >> $GITHUB_STEP_SUMMARY
```

This makes the scorecard visible in the GitHub Actions run summary for every PR.

**Option B: PR Comment via GitHub API**

Use a GitHub Action (e.g., `marocchino/sticky-pull-request-comment`) to post/update the scorecard as a PR comment. This is more visible but requires a GitHub token with write permissions.

**Option C: CI Artifact**

Upload the scorecard as a build artifact for archival and trend analysis.

**Recommendation**: Start with Option A (Job Summary) for simplicity, then add Option B (PR Comment) for better visibility.

---

## Integration with Existing Infrastructure

### Fitness Function Framework

The existing fitness function system is well-structured for extension:

```
.github/scripts/fitness-functions/
  common/
    constants.ts      -- Add new regex patterns here
    shared.ts          -- Add new diff-parsing utilities here
    test-data.ts       -- Add new test data generators here
  rules/
    index.ts           -- Register new rules here
    javascript-additions.ts    -- Existing: block new JS files
    prevent-code-blocks.ts     -- Existing: block blacklisted code
    prevent-new-any-types.ts   -- NEW: block new `any` in TS
    prevent-ts-ignore-additions.ts -- NEW: block new `@ts-ignore`
    migration-progress.ts      -- NEW: track migration %
  index.ts             -- Entry point (no changes needed)
```

#### New Constants (`common/constants.ts`)

```typescript
// Match TypeScript files in app/
const APP_FOLDER_TS_REGEX = /^(app).*\.(ts|tsx)$/;

// Match any type annotations
const ANY_TYPE_REGEX = /:\s*any\b|as\s+any\b|<any[\s,>]/;

// Match ts-ignore directives
const TS_IGNORE_REGEX = /@ts-ignore/;

// Match ts-expect-error directives
const TS_EXPECT_ERROR_REGEX = /@ts-expect-error/;

// Match sanctioned any TODO comment
const SANCTIONED_ANY_TODO_REGEX = /TODO:\s*Replace\s*"any"\s*with\s*type/;
```

#### Updated Rules Registry (`rules/index.ts`)

```typescript
const RULES: IRule[] = [
  {
    name: 'Check for blacklisted code blocks',
    fn: preventCodeBlocksRule,
    docURL: '[WIP] No documentation exists for this rule yet.',
  },
  {
    name: 'Check for js or jsx file being added',
    fn: preventJavaScriptFileAdditions,
    docURL: '[WIP] No documentation exists for this rule yet.',
  },
  {
    name: 'Check for new any type annotations in TypeScript files',
    fn: preventNewAnyTypes,
    docURL: '[WIP] Link to migration guidelines.',
  },
  {
    name: 'Check for new @ts-ignore directives',
    fn: preventTsIgnoreAdditions,
    docURL: '[WIP] Link to migration guidelines.',
  },
];
```

### CI Pipeline Integration

#### `.github/workflows/fitness-functions.yml`

No changes needed -- new rules registered in `rules/index.ts` are automatically picked up by the existing fitness function runner.

#### `.github/workflows/ci.yml`

Add the migration metrics scripts to the CI matrix:

```yaml
strategy:
  matrix:
    scripts:
      - lint
      - lint:tsc
      - audit:ci
      - test:depcheck
      - test:tgz-check
      - migration:check-any-count   # NEW
```

Add a new job for the migration scorecard:

```yaml
migration-scorecard:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version-file: '.nvmrc'
        cache: yarn
    - run: yarn setup --node
    - name: Generate migration scorecard
      run: yarn migration:scorecard >> $GITHUB_STEP_SUMMARY
```

### ESLint Integration

The existing ESLint configuration already enforces `@typescript-eslint/no-explicit-any: error` for TypeScript files. The test harness complements this by:

1. Catching `any` patterns that ESLint might miss (e.g., in type declarations, generics).
2. Tracking the count of existing `eslint-disable` comments that suppress the rule.
3. Preventing _new_ `eslint-disable` comments for `no-explicit-any` from being added.

### SonarCloud Integration

The existing SonarCloud setup in CI can be leveraged:

- Configure SonarCloud quality gate rules to flag files with high `any` density.
- Use SonarCloud's code smell tracking to monitor type quality trends.

---

## Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

| Task | Priority | Effort |
|------|----------|--------|
| Create `migration-baseline.json` with current metrics | High | 1 day |
| Implement `prevent-new-any-types.ts` fitness function + tests | High | 2-3 days |
| Implement `prevent-ts-ignore-additions.ts` fitness function + tests | High | 1-2 days |
| Add new constants to `common/constants.ts` | High | 0.5 day |
| Register new rules in `rules/index.ts` | High | 0.5 day |
| Verify all new fitness function tests pass locally | High | 0.5 day |

### Phase 2: Metrics & Reporting (Week 3-4)

| Task | Priority | Effort |
|------|----------|--------|
| Implement `scripts/migration/migration-metrics.ts` (any + ts-ignore counter) | Medium | 2 days |
| Implement `scripts/migration/migration-scorecard.ts` | Medium | 2-3 days |
| Add `migration:check-any-count` and `migration:scorecard` scripts to `package.json` | Medium | 0.5 day |
| Integrate scorecard into CI as GitHub Actions Job Summary | Medium | 1 day |
| Validate end-to-end in a test PR | Medium | 1 day |

### Phase 3: Tracking & Trending (Week 5-6)

| Task | Priority | Effort |
|------|----------|--------|
| Implement `migration:update-baseline` script | Low | 1 day |
| Implement `migration-progress.ts` filesystem-based fitness function | Low | 2 days |
| Add migration scorecard as a PR comment (Option B) | Low | 1-2 days |
| Create documentation for the migration test harness | Low | 1 day |
| Set up scheduled CI job to update baseline after releases | Low | 1 day |

### Phase 4: Advanced (Optional, Week 7+)

| Task | Priority | Effort |
|------|----------|--------|
| Add per-directory migration progress breakdown | Low | 2 days |
| Integrate type coverage tool (e.g., `type-coverage` npm package) for deeper analysis | Low | 2-3 days |
| Create a migration dashboard (e.g., GitHub Pages site with historical charts) | Low | 3-5 days |
| Add pre-commit hook support for local developer feedback | Low | 1-2 days |

---

## Appendix: Current Migration Snapshot

### Migration Percentage by Top-Level Directory

Computed from the current codebase:

| Directory | JS Files | TS Files | Migration % |
|-----------|----------|----------|-------------|
| `app/store/migrations/` | 38 | varies | Low |
| `app/components/UI/Swaps/` | 19+ | varies | Medium |
| `app/util/` | 13 | varies | High |
| `app/core/` | 10 | varies | High |
| `app/components/Base/Keypad/` | 7 | varies | Low |

### Key Files with `any` Technical Debt

- `app/reducers/index.ts` -- 15+ `any` types in `RootState` interface (lines 56-127)
- `app/declarations/index.d.ts` -- Module declarations using `any` for third-party types
- Various components with `// TODO: Replace "any" with type` markers (~341 occurrences)

### Existing PR Naming Convention

Migration PRs follow: `chore(js-ts): Convert [file/module] to TypeScript`

This convention should be documented in the test harness README and can be used to auto-detect migration PRs for enhanced scorecard reporting.
