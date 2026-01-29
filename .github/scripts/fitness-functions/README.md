# Fitness Functions

Fitness functions are automated checks that run during CI to enforce architectural decisions and track code quality metrics. They help maintain codebase health by preventing regressions and tracking progress toward goals.

## Overview

The fitness functions in this directory enforce the following rules:

1. **Prevent JavaScript File Additions** - Blocks new `.js` or `.jsx` files from being added to the `app/` directory
2. **Prevent Blacklisted Code Blocks** - Blocks usage of deprecated patterns (e.g., enzyme imports)
3. **TypeScript Adoption Tracking** - Reports the current TypeScript adoption percentage

## TypeScript Adoption

The MetaMask Mobile codebase is actively migrating to TypeScript. The fitness functions track and enforce this migration:

### Tracking

Every CI run reports the current TypeScript adoption percentage, showing:
- Number of TypeScript files (`.ts`, `.tsx`)
- Number of JavaScript files (`.js`, `.jsx`)
- Total source files
- Adoption percentage

### Enforcement

New JavaScript files are **not allowed** in the `app/` directory. If you attempt to add a new `.js` or `.jsx` file, the CI check will fail with the message:

```
Checking rule "Check for js or jsx file being added"...
...FAILED. Changes not accepted by the fitness function.
```

### Converting Existing Files

When converting existing JavaScript files to TypeScript:

1. Rename the file from `.js`/`.jsx` to `.ts`/`.tsx`
2. Add type annotations as needed
3. Fix any TypeScript errors that arise
4. The fitness function will automatically detect the improvement in adoption percentage

## Running Locally

You can run the fitness functions locally to test your changes before pushing:

```bash
cd .github/scripts
yarn install
yarn fitness-functions -- "pre-commit-hook"
```

For CI-style execution with a diff file:

```bash
cd .github/scripts
git diff origin/main HEAD -- . > ./diff
yarn fitness-functions -- "ci" "./diff"
```

## CI Integration

The fitness functions run automatically on every pull request via the `.github/workflows/fitness-functions.yml` workflow. The workflow:

1. Checks out the code with full history
2. Installs dependencies in `.github/scripts`
3. Generates a diff between the PR branch and the base branch
4. Runs all fitness function rules against the diff
5. Reports TypeScript adoption statistics

## Adding New Rules

To add a new fitness function rule:

1. Create a new file in `rules/` (e.g., `my-rule.ts`)
2. Export a function that takes a diff string and returns a boolean (true = pass, false = fail)
3. Add the rule to the `RULES` array in `rules/index.ts`
4. Add tests in a corresponding `.test.ts` file

Example rule structure:

```typescript
function myRule(diff: string): boolean {
  // Analyze the diff
  // Return true if the rule passes, false if it fails
  return true;
}

export { myRule };
```

## File Structure

```
fitness-functions/
├── index.ts                 # Main entry point
├── README.md                # This documentation
├── common/
│   ├── constants.ts         # Shared constants and regex patterns
│   ├── get-diff.ts          # Diff retrieval utilities
│   ├── shared.ts            # Shared utility functions
│   └── test-data.ts         # Test data generators
└── rules/
    ├── index.ts             # Rule registry and runner
    ├── javascript-additions.ts    # Prevents new JS files
    ├── prevent-code-blocks.ts     # Prevents blacklisted patterns
    └── typescript-adoption.ts     # Tracks TS adoption
```
