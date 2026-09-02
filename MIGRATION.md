# JavaScript → TypeScript Migration Guide

This repository is a hybrid JS/TS codebase and is being converted to TypeScript **incrementally, one
file at a time**. No build configuration changes are needed to convert a file:

- `tsconfig.json` sets `allowJs: true` and `strict: true`, so `.js` and `.ts` coexist.
- Babel (`babel-preset-expo`) transpiles both, for Metro and for Jest.
- `.eslintrc.js` has a `*.{ts,tsx}` override that adds `@metamask/eslint-config-typescript`, so a
  converted file is linted more strictly than the `.js` file it replaces.

Because every conversion is self-contained, files can be converted **in parallel** by different
people: pick a file off the top of [`MIGRATION_INVENTORY.md`](./MIGRATION_INVENTORY.md), which lists
the remaining `.js`/`.jsx` files leaf-first (fewest internal dependents first), and open one PR per
file (or per small, closely related group).

## Per-file conversion checklist

1. **Rename the file** — `git mv` so history is preserved:
   - `.js` → `.ts` for modules with no JSX.
   - `.jsx`, or any `.js` containing JSX, → `.tsx`.
   - Rename the co-located test the same way (`foo.test.js` → `foo.test.ts` / `.test.tsx`), and any
     `__mocks__` or `.stories.` file for the module.
   - Do **not** rename `index.android.js` / `index.ios.js` to `.ts` unless both platform variants are
     converted in the same PR — Metro resolves the platform extension, and a half-converted pair is
     easy to get wrong.

2. **Add explicit types.** `@typescript-eslint/no-explicit-any` is an **error** for `.ts`/`.tsx`
   files, so `any` is not an option:
   - Type every exported function's parameters and return value.
   - Use `unknown` plus a narrowing guard (`isObject` / `hasProperty` from `@metamask/utils`) where
     the shape genuinely isn't known, instead of `any`.
   - Prefer reusing types already exported by `@metamask/*` controllers over redefining shapes.
   - For constants, `as const` keeps literal types (`export const PROTECT = 'protect' as const`).
   - For React components, replace `propTypes` with an `interface Props`, and type refs
     (`useRef<TextInput>(null)`) and `connect()` state/dispatch props explicitly.
   - If a lint rule genuinely cannot be satisfied, disable it on the single line with a comment
     explaining why — never widen the type to `any`.

3. **Declare untyped imports.** If the module imports a dependency with no bundled types, add an
   ambient declaration to [`app/declarations/index.d.ts`](./app/declarations/index.d.ts) rather than
   casting at the call site:

   ```ts
   declare module 'unicode-confusables' {
     export function confusables(input: string): { point: string; similarTo?: string }[];
   }
   ```

   Declare the narrowest accurate shape you can — the declaration is the type contract for every
   future caller. Only fall back to a bare `declare module 'pkg';` (implicit `any` module) when the
   surface is large and out of scope for the PR.

4. **Validate.** All three must pass before review:

   ```bash
   yarn lint:tsc                                  # tsc --noEmit over the whole project
   yarn lint                                      # eslint, incl. the stricter TS override
   yarn jest --findRelatedTests <converted-file>  # tests covering the file and its importers
   ```

   `yarn lint:tsc` is a whole-project check: it also catches breakage in the file's *consumers*,
   which is the main risk of a conversion. Run the full `yarn test:unit` before merging anything with
   more than a handful of dependents.

5. **Keep the change type-only.** Do not refactor logic, rename exports, convert class components to
   hooks or `connect()` to hooks in the same PR. Snapshot tests should produce byte-identical output;
   if a snapshot changes, the conversion changed behaviour.

6. **Refresh the inventory** when you convert a batch:

   ```bash
   node scripts/js-ts-migration/generate-inventory.js
   ```

## Regression guardrail

`.github/scripts/fitness-functions` runs on every PR (`.github/workflows/fitness-functions.yml`) and
**fails** the build when a new `.js`/`.jsx` file is added under `app/` (rule
`preventJavaScriptFileAdditions`, regex `APP_FOLDER_JS_REGEX`).

`scripts/js-ts-migration/check-js-additions.js` is the local, **non-blocking** counterpart: it warns
about new `.js`/`.jsx` files under `app/` and prints the current migration progress, always exiting
`0`. Run it against any base ref:

```bash
node scripts/js-ts-migration/check-js-additions.js            # vs. origin/main
node scripts/js-ts-migration/check-js-additions.js origin/foo # vs. another base
```

It is wired into `.github/workflows/ci.yml` with `continue-on-error: true`, so it reports progress in
the job log without ever failing a build.

## Conventions worth copying

Look at an already-converted neighbour before inventing a pattern. Good references:

| Kind | Reference |
| --- | --- |
| Pure util | `app/util/string/index.ts`, `app/util/bytes.ts` |
| Constants | `app/constants/urls.ts`, `app/constants/bridge.ts` |
| Redux actions/reducers | `app/actions/onboarding/index.ts`, `app/reducers/security/index.ts` |
| Store migration | `app/store/migrations/028.ts` |
| Core service | `app/core/Authentication/Authentication.ts` |
| Presentational component | anything under `app/component-library/components/` |
| Connected component | `app/components/UI/Tokens/index.tsx` |

Commit / PR naming convention used so far: `chore(js-ts): Convert <file> to TypeScript`.
