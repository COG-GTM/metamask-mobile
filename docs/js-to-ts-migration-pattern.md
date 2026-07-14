# JS → TS Migration Pattern for Utility Modules

A short, copy-friendly recipe for migrating a small **utility module** in
`app/util/` from JavaScript to TypeScript. It is intentionally beginner
friendly: follow the steps top to bottom and you will end up with a typed,
tested module that passes CI.

> **Scope:** this guide is for pure utility modules (functions that take input
> and return output) in `app/util/`. It is **not** for React views,
> components, or Redux actions/reducers — those have their own playbooks
> because they involve JSX, props, and store types.

The repo is already configured for a gradual migration:

- `tsconfig.json` has `"strict": true` and `"allowJs": true`, so `.ts` and
  `.js` files coexist.
- `jest.config.js` transforms both `.js` and `.ts`, so tests keep working
  across the rename.
- The TypeScript app gate (a fitness function) blocks **new** `.js`/`.jsx`
  files in `app/`, so migrating a file is a one-way door — once it is `.ts`,
  it stays `.ts`.

No build-config changes are needed. You just rename, add types, and validate.

---

## The pattern, step by step

### 1. Rename `.js` → `.ts`

Use `git mv` so history follows the file:

```bash
git mv app/util/scaling.js app/util/scaling.ts
```

### 2. Add explicit parameter and return types

Type every exported function's parameters and return value. Prefer precise
types over `any`:

- Object/options arguments → a named `interface`.
- Values that are genuinely one of several types → a union (e.g.
  `number | string`).
- Unknown/opaque input → `unknown` (then narrow), never `any`.

Look at an already-migrated neighbor for house style, e.g.
`app/util/string/index.ts` or `app/util/mnemonic/index.ts`.

### 3. Update imports

- Import paths generally do **not** change — TypeScript resolves
  `./scaling` to `scaling.ts` automatically, so callers using
  `import scaling from '../../util/scaling'` keep working.
- Add any type-only imports the new signatures need, using
  `import type { ... }` where you import only types.
- If a caller relied on loose/implicit behavior that is now a type error,
  fix the caller — do not loosen the util's types to hide it.

### 4. Add or update focused unit tests

- If a `scaling.test.ts` / `.test.js` already exists, keep it and make sure it
  still passes. Rename `.test.js` → `.test.ts` if you touch it.
- If there is no test, add a small one that exercises the exported functions'
  input → output behavior. `app/util/date/index.test.ts` is a good reference
  for a typed util test.
- Keep tests focused on the module's public API; do not add broad
  integration tests.

### 5. Validate

Run the three universal gates. All must pass with zero errors:

```bash
# 1. Type check — whole project must still compile
yarn tsc --noEmit          # (or: npx tsc --noEmit)

# 2. Run the tests related to the file you changed
yarn test --findRelatedTests app/util/scaling.ts

# 3. Lint
yarn lint
```

If `tsc` reports errors in files that import your module, that is expected —
you have surfaced real type mismatches. Fix them at the call site.

---

## Concrete before/after: `app/util/scaling.js` → `app/util/scaling.ts`

The current `scaling.js` has fully untyped functions. `scale` takes a numeric
`size` and an options object, and returns a number:

**Before — `app/util/scaling.js`**

```javascript
import { Dimensions, PixelRatio } from 'react-native';

const getBaseModel = (baseModel) => {
  if (baseModel === 1) {
    return { width: IPHONE_11_PRO_WIDTH, height: IPHONE_11_PRO_HEIGHT };
  } else if (baseModel === 2) {
    return { width: IPHONE_11_PRO_MAX_WIDTH, height: IPHONE_11_PRO_MAX_HEIGHT };
  }
  return { width: IPHONE_6_WIDTH, height: IPHONE_6_HEIGHT };
};

const scale = (
  size,
  { factor = 1, scaleVertical = false, scaleUp = false, baseSize = undefined, baseModel } = {},
) => {
  const { currSize, baseScreenSize } = _getSizes(scaleVertical, baseModel);
  const sizeScaled = ((baseSize || currSize) / baseScreenSize) * size;

  if (sizeScaled <= size || scaleUp) {
    return PixelRatio.roundToNearestPixel(size + (sizeScaled - size) * factor);
  }
  return size;
};

const scaleVertical = (size, options) =>
  scale(size, { scaleVertical: true, ...options });

export default { scale, scaleVertical, IPHONE_6_WIDTH, IPHONE_6_HEIGHT };
```

**After — `app/util/scaling.ts`**

Give the options object a named `interface`, annotate the `baseModel`
argument, and declare the numeric return types. The runtime logic is
unchanged — only types are added.

```typescript
import { Dimensions, PixelRatio } from 'react-native';

interface Dimension {
  width: number;
  height: number;
}

interface ScaleOptions {
  factor?: number;
  scaleVertical?: boolean;
  scaleUp?: boolean;
  baseSize?: number;
  baseModel?: number;
}

const getBaseModel = (baseModel?: number): Dimension => {
  if (baseModel === 1) {
    return { width: IPHONE_11_PRO_WIDTH, height: IPHONE_11_PRO_HEIGHT };
  } else if (baseModel === 2) {
    return { width: IPHONE_11_PRO_MAX_WIDTH, height: IPHONE_11_PRO_MAX_HEIGHT };
  }
  return { width: IPHONE_6_WIDTH, height: IPHONE_6_HEIGHT };
};

const scale = (
  size: number,
  {
    factor = 1,
    scaleVertical = false,
    scaleUp = false,
    baseSize = undefined,
    baseModel,
  }: ScaleOptions = {},
): number => {
  const { currSize, baseScreenSize } = _getSizes(scaleVertical, baseModel);
  const sizeScaled = ((baseSize || currSize) / baseScreenSize) * size;

  if (sizeScaled <= size || scaleUp) {
    return PixelRatio.roundToNearestPixel(size + (sizeScaled - size) * factor);
  }
  return size;
};

const scaleVertical = (size: number, options?: ScaleOptions): number =>
  scale(size, { scaleVertical: true, ...options });

export default { scale, scaleVertical, IPHONE_6_WIDTH, IPHONE_6_HEIGHT };
```

### What changed (and what didn't)

| Change | Why |
|--------|-----|
| Added `ScaleOptions` interface | Documents and enforces the options bag shape |
| Added `Dimension` interface | Types the `{ width, height }` return of `getBaseModel` |
| Annotated params (`size: number`, `baseModel?: number`) | Callers now get autocompletion and type errors |
| Declared `: number` return types | Prevents accidental non-numeric returns |
| **No logic changes** | Migration adds types only — behavior must stay identical |

---

## Key principles

- **Types only, no refactors.** A migration PR should change behavior in zero
  observable ways. If you spot a bug, fix it in a separate PR.
- **No `any`.** Reach for `unknown` + narrowing, unions, or a named
  `interface` instead.
- **Follow migrated neighbors.** `app/util/string/index.ts` and
  `app/util/date/index.ts` show the house style for typed utils and their
  tests.
- **All three gates must pass**: `tsc --noEmit`, related tests, and `yarn lint`.
