# Engine Type Definition Patterns

This document describes the conventions and patterns used for type definitions
in the `Engine/` directory. Follow these when adding new controllers, messengers,
or utility types to keep the codebase consistent.

---

## Directory Layout

```
app/core/Engine/
├── types.ts              # Canonical source of all Engine type definitions
├── types/                # Organized re-exports by domain
│   ├── index.ts          # Barrel export (re-exports everything)
│   ├── controllers.ts    # Controller, state, and context types
│   ├── messenger.ts      # Messenger types
│   ├── controller-init.ts# Modularized init types
│   ├── utility.ts        # Utility / return types for Engine methods
│   └── PATTERNS.md       # This file
├── constants.ts          # Engine constants (e.g. STATELESS_NON_CONTROLLER_NAMES)
├── controllers/          # Per-controller init functions
├── messengers/           # Per-controller messenger callbacks
└── Engine.ts             # Main Engine class
```

### Where to define types

| Kind of type | Where to add it |
|---|---|
| Controller map entry | `types.ts` → `Controllers` |
| Controller state entry | `types.ts` → `EngineState` |
| Global action/event | `types.ts` → `GlobalActions` / `GlobalEvents` |
| Controller init function | `types.ts` → `ControllersToInitialize`, then `controllers/<name>/` |
| Engine method return type | `types.ts` (utility section at bottom) |
| Controller-specific internal types | Co-locate in the controller's own package or init file |

### Where to import types

Prefer importing from the barrel:

```ts
// Good — uses the barrel
import type { Controllers, EngineState } from './types';

// Also good — uses the organized subdirectory
import type { Controllers, EngineState } from './types/controllers';

// Avoid — bypasses the barrel
import type { Controllers } from './types.ts';
```

---

## Controller Type Pattern

Every controller in the Engine has two corresponding type entries:

1. **`Controllers`** — maps the controller name to its class instance type.
2. **`EngineState`** — maps the controller name to its state type.

```ts
// In types.ts
export type Controllers = {
  // ...
  MyNewController: MyNewController;
};

export type EngineState = {
  // ...
  MyNewController: MyNewControllerState;
};
```

### Required vs Optional Controllers

- **Required** controllers are always instantiated. They go in `Controllers` directly.
- **Optional** controllers (like `PPOMController`) may not be instantiated.
  Add them to `OptionalControllers` so that `EngineContext` uses `Partial<>` for them.

```ts
type RequiredControllers = Omit<Controllers, 'PPOMController'>;
type OptionalControllers = Pick<Controllers, 'PPOMController'>;
export type EngineContext = RequiredControllers & Partial<OptionalControllers>;
```

### Stateful vs Stateless

Some entries in `Controllers` are not true stateful controllers (e.g. detection
controllers, execution services). These are listed in `STATELESS_NON_CONTROLLER_NAMES`
in `constants.ts` and are excluded from `StatefulControllers`:

```ts
export type StatefulControllers = Omit<
  Controllers,
  (typeof STATELESS_NON_CONTROLLER_NAMES)[number]
>;
```

---

## Messenger Type Pattern

The Engine uses a single `BaseControllerMessenger` (unrestricted) that is narrowed
into `BaseRestrictedControllerMessenger` instances for each controller.

### Adding a new controller's actions/events

1. Import the controller's `*Actions` and `*Events` types in `types.ts`.
2. Add them to the `GlobalActions` and `GlobalEvents` unions.

```ts
// In types.ts
type GlobalActions =
  | /* existing */
  | MyNewControllerActions;

type GlobalEvents =
  | /* existing */
  | MyNewControllerEvents;
```

### Creating a messenger callback

Create a file in `Engine/messengers/`:

```ts
// messengers/my-new-controller-messenger.ts
import type { BaseControllerMessenger } from '../types';

export function getMyNewControllerMessenger(messenger: BaseControllerMessenger) {
  return messenger.getRestricted({
    name: 'MyNewController',
    allowedActions: [/* ... */],
    allowedEvents: [/* ... */],
  });
}
```

Then register it in `messengers/index.ts`.

---

## Controller Init Pattern

Controllers that use the modularized init pattern:

1. Are listed in `ControllersToInitialize` (union of string literals).
2. Have a messenger callback registered in `CONTROLLER_MESSENGERS`.
3. Have an init function in `Engine/controllers/` that satisfies `ControllerInitFunction`.

```ts
// controllers/my-new-controller/index.ts
import type { ControllerInitFunction } from '../../types';
import type { MyNewController } from '@metamask/my-new-controller';
import type { MyNewControllerMessenger } from '../../messengers/my-new-controller-messenger';

export const myNewControllerInit: ControllerInitFunction<
  MyNewController,
  MyNewControllerMessenger
> = (request) => {
  const { controllerMessenger, persistedState } = request;
  const controller = new MyNewController({
    messenger: controllerMessenger,
    state: persistedState.MyNewController,
  });
  return { controller };
};
```

---

## Utility Type Pattern

Return types for Engine methods should be extracted into named interfaces
in the utility section at the bottom of `types.ts`:

```ts
// In types.ts
export interface TotalFiatBalance {
  ethFiat: number;
  tokenFiat: number;
  // ...
}
```

Then use the type in `Engine.ts`:

```ts
getTotalEvmFiatAccountBalance(): TotalFiatBalance {
  // ...
}
```

---

## Conventions

- **Use `type` for unions and mapped types**, `interface` for extensible object shapes.
- **Always add JSDoc comments** to exported types explaining purpose and usage.
- **Keep imports sorted**: external packages first, then internal modules.
- **Use `eslint-disable` sparingly** — only for known framework incompatibilities
  (e.g. `@typescript-eslint/consistent-type-definitions` for controller maps).
- **Conditional compilation**: Use `///: BEGIN:ONLY_INCLUDE_IF(feature)` / `END` guards
  for feature-flagged controllers (snaps, keyring-snaps, etc.).
