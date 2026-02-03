# TypeScript Migration Progress

This document tracks the progress of migrating the MetaMask Mobile codebase from JavaScript to TypeScript.

## Overview

The MetaMask Mobile codebase is undergoing an incremental migration from JavaScript to TypeScript. TypeScript is configured with strict mode active (`tsconfig.json`), and the configuration allows JavaScript files during the migration period (`allowJs: true`).

## Current Status

| Metric | Value |
|--------|-------|
| TypeScript Files | 3,919 |
| JavaScript Files | 326 |
| Migration Progress | **92.3%** |

*Last updated: 2026-02-03*

## Migration Protection

A fitness function prevents new JavaScript files from being added to the `app/` directory. This is enforced in CI/CD on every pull request.

**How it works:**
- The fitness function is defined in `.github/scripts/fitness-functions/rules/javascript-additions.ts`
- It runs via the GitHub Actions workflow `.github/workflows/fitness-functions.yml`
- Any PR that adds a new `.js` or `.jsx` file to the `app/` directory will fail CI
- Existing JavaScript files can still be modified, but new files must be TypeScript

## Files by Category

| Category | Count | Description |
|----------|-------|-------------|
| Other | 230 | Miscellaneous files (migrations, configs, etc.) |
| Test | 40 | Test files (.test.js, .spec.js) |
| Component | 36 | React components |
| Reducer | 12 | Redux reducers |
| Utility | 4 | Utility functions |
| Style | 3 | Style-related files |
| Library | 1 | Library code |

## Files by Complexity

Complexity is estimated based on file size:
- **Low** (< 2KB): 112 files - Quick conversions
- **Medium** (2-10KB): 137 files - Moderate effort
- **High** (> 10KB): 77 files - Significant effort required

## Priority Directories

The following directories have the most JavaScript files remaining and should be prioritized:

### High Priority (Core functionality)

| Directory | JS Files | Notes |
|-----------|----------|-------|
| `store/migrations` | 38 | State migrations - convert incrementally |
| `core` | 10 | Core wallet functionality |
| `core/RPCMethods` | 6 | RPC method handlers |
| `core/BackgroundBridge` | 2 | DApp communication bridge |
| `core/Permissions` | 2 | Permission management |

### Medium Priority (UI Components)

| Directory | JS Files | Notes |
|-----------|----------|-------|
| `components/UI/Swaps/components` | 14 | Swap UI components |
| `components/Base/Keypad` | 7 | Keypad component |
| `components/UI/Swaps/utils` | 5 | Swap utilities |
| `components/Base` | 4 | Base components |
| `components/Nav/Main` | 3 | Main navigation |
| `components/UI/StyledButton` | 3 | Styled button (platform-specific) |
| `components/UI/TransactionElement` | 3 | Transaction display |

### Lower Priority (Utilities and Tests)

| Directory | JS Files | Notes |
|-----------|----------|-------|
| `util` | 13 | Utility functions |
| `util/test` | 8 | Test utilities |
| `constants` | 3 | Constants files |

## How to Contribute

### Converting a File

1. Create a new branch following the naming convention: `chore(js-ts): Convert [filename] to TypeScript`
2. Rename the file from `.js`/`.jsx` to `.ts`/`.tsx`
3. Add proper TypeScript types:
   - Use interfaces for prop and state type definitions
   - Use `ReactNode` for children prop types
   - Use `StyleProp<ViewStyle>` for style prop types
4. Fix any type errors that arise
5. Run `yarn lint:tsc` to verify no type errors
6. Create a PR with a clear description of the conversion

### Guidelines

- Follow the existing TypeScript patterns in the codebase
- Prefer interfaces over type aliases for object types
- Avoid using `any` - use proper types or `unknown` if necessary
- Maintain all existing functionality during conversion
- Include tests if the original file had tests

### Updating This Document

After converting files, update the progress by running:

```bash
npx ts-node scripts/typescript-migration/scan-js-files.ts
```

This will regenerate the inventory and display updated statistics.

## Detailed File Inventory

A complete inventory of all remaining JavaScript files is available at:
`scripts/typescript-migration/js-files-inventory.json`

This JSON file contains:
- Full file paths
- File categories
- Complexity estimates
- Directory groupings

## Related Resources

- [TypeScript Configuration](./tsconfig.json)
- [Fitness Function](/.github/scripts/fitness-functions/rules/javascript-additions.ts)
- [CI Workflow](/.github/workflows/fitness-functions.yml)
- [Coding Guidelines](/.github/guidelines/CODING_GUIDELINES.md)

## Migration History

| Date | Files Converted | Notes |
|------|-----------------|-------|
| 2026-02-03 | - | Migration infrastructure established |

---

*This document is part of the TypeScript migration initiative. For questions or suggestions, please open an issue or discussion.*
