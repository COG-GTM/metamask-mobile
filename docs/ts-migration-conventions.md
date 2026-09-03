# JS → TS Migration Conventions

Rules every migration PR follows. See [`ts-migration-plan.md`](./ts-migration-plan.md) for the slicing and [`ts-migration-tracker.md`](./ts-migration-tracker.md) for ownership.

The guiding principle: **rename + type, never refactor.** Runtime behaviour, component structure, and snapshot output must be identical before and after.

## 1. Renaming

- Contains JSX → `.tsx`; otherwise `.ts`. Platform files keep their suffix: `index.android.js` → `index.android.tsx`.
- Use `git mv` so history follows the file.
- Co-located tests move in the same PR: `Foo.test.js` → `Foo.test.ts(x)`. Snapshot files (`__snapshots__/*.snap`) are keyed by test _name_, not file extension, and must not change. Never run jest with `-u` in a migration PR.
- Do not rename directories, split files, or move exports.
- Search for literal extension imports before finishing: `git grep -n "\.js'" -- <your files>`.

## 2. PropTypes → TypeScript

Delete `import PropTypes from 'prop-types'` and the `Component.propTypes = {...}` block; replace with an interface next to the component.

| PropTypes                        | TypeScript                                                                                                        |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `PropTypes.string`               | `string`                                                                                                          |
| `PropTypes.number`               | `number`                                                                                                          |
| `PropTypes.bool`                 | `boolean`                                                                                                         |
| `PropTypes.func`                 | the real signature, e.g. `(address: string) => void`; use `() => void` only when the callback truly takes nothing |
| `PropTypes.node`                 | `React.ReactNode`                                                                                                 |
| `PropTypes.element`              | `React.ReactElement`                                                                                              |
| `PropTypes.object`               | a named interface (look at the call sites); last resort `Record<string, unknown>`                                 |
| `PropTypes.array` / `arrayOf(X)` | `X[]`                                                                                                             |
| `PropTypes.shape({...})`         | a named interface                                                                                                 |
| `PropTypes.oneOf(['a','b'])`     | `'a' \| 'b'`                                                                                                      |
| `PropTypes.oneOfType([A, B])`    | `A \| B`                                                                                                          |
| `PropTypes.any`                  | `unknown`, or `any` with a `TODO(ts-migration)` tag (see §7)                                                      |
| `.isRequired`                    | required property; everything else gets `?`                                                                       |

`defaultProps` on function components: convert to default parameter values in the destructuring. On class components, keep `static defaultProps` and type `Props` with the defaulted members optional.

## 3. React Native components

- Props and state are declared with `interface` (not `type` aliases). `children` is `React.ReactNode`; `style` props are `StyleProp<ViewStyle>` (or `StyleProp<TextStyle>`); optional callbacks are `onPress?: () => void`.
- `Animated` values are typed explicitly: `Animated.Value`, `Animated.AnimatedInterpolation<number>`, `useRef(new Animated.Value(0)).current`.
- Function components: `const Foo = ({ a, b }: FooProps) => { ... }`. Do not wrap in `React.FC`.
- Class components: `class Foo extends PureComponent<FooProps, FooState>`; declare `state: FooState = {...}`.
- Styles: let `StyleSheet.create` infer. If a style object is built from a theme (`createStyles(colors)`), type the parameter with `Theme['colors']` from `app/util/theme/models`.
- Refs: `useRef<TextInput>(null)`, `React.createRef<View>()`.
- `useContext(ThemeContext)` / `this.context` → `const { colors } = this.context as Theme` only when the class-component contextType pattern forces it; function components use `useTheme()` from `app/util/theme`.
- Navigation: `navigation: StackNavigationProp<ParamListBase>` and `route: RouteProp<ParamListBase, string>` (from `@react-navigation/stack` / `@react-navigation/native`). Until `RootStackParamList` exists (slice C7), typing `route.params` requires a local `type Params = {...}` cast: `const { address } = route.params as Params;`.
- Reference implementations: `app/components/Views/Wallet/index.tsx`, `app/components/Views/Login/index.tsx`, `app/components/UI/Tokens/index.tsx`, and anything under `app/component-library/components/`.

## 4. Redux

**Actions** (`app/actions/**`, reference `app/actions/onboarding/index.ts`):

```ts
export const SHOW_ALERT = 'SHOW_ALERT';

interface ShowAlertAction {
  type: typeof SHOW_ALERT;
  isVisible: boolean;
  autodismiss: number | null;
  content: string | null;
  data: unknown;
}

export type AlertActionTypes = ShowAlertAction | HideAlertAction;

export function showAlert({
  isVisible,
  autodismiss,
  content,
  data,
}: Omit<ShowAlertAction, 'type'>): ShowAlertAction {
  return { type: SHOW_ALERT, isVisible, autodismiss, content, data };
}
```

**Reducers** (`app/reducers/**`, reference `app/reducers/security/index.ts`): export `interface XState`, type `initialState: XState`, and the reducer as `(state: XState = initialState, action: XActionTypes): XState`. Then replace the matching `any` slot in `RootState` (`app/reducers/index.ts`) with `XState`.

**Selectors**: `(state: RootState) => ...`. Use `createSelector` from `reselect` where the file already does; don't introduce it.

**Connected components**: keep `connect()`. Type as:

```ts
interface OwnProps { ... }
type StateProps = ReturnType<typeof mapStateToProps>;
type DispatchProps = ReturnType<typeof mapDispatchToProps>;
type Props = OwnProps & StateProps & DispatchProps;

const mapStateToProps = (state: RootState) => ({ ... });
const mapDispatchToProps = (dispatch: Dispatch) => ({ ... });
export default connect(mapStateToProps, mapDispatchToProps)(Foo);
```

Do not convert `connect()` components to hooks in a migration PR.

## 5. Conditional-compilation comments

The build preprocessor keys on the exact lines

```
///: BEGIN:ONLY_INCLUDE_IF(flask,external-snaps)
...
///: END:ONLY_INCLUDE_IF
```

- Preserve them byte-for-byte, in the same position relative to the code they wrap. Prettier leaves `///:` comments alone; do not let an editor reflow them.
- If the wrapped block declares something used outside the block (an import, a variable), the non-flavour build will not have it. That was already true in JS; in TS it may now surface as an error. Fix it exactly as neighbouring TS files do: hoist a typed declaration outside the block and assign inside it, or use the same `///:` fence around the usage. Never delete a fence to make `tsc` happy.
- After migrating a file containing fences, run `yarn typecheck` and `yarn lint` — the preprocessor itself is exercised by the Bitrise flavour builds, so mention the fenced file in the PR description so reviewers can trigger one.
- Files with fences on `main`: `app/components/Nav/Main/MainNavigator.js`, `app/core/RPCMethods/**` (snaps handlers), `app/core/Permissions/specifications.js`, and a few more — `git grep -l "ONLY_INCLUDE_IF" -- 'app/**/*.js'` lists them.

## 6. Tests

- Rename `.test.js(x)` alongside the source. Type mocks with `jest.mocked(fn)` or `jest.MockedFunction<typeof fn>`.
- Mock stores: `renderWithProvider(<Foo />, { state: { engine: { backgroundState } } })` — pass `as unknown as RootState` only if the partial state doesn't type-check; better, use `DeepPartial<RootState>` from `app/util/test/renderWithProvider`.
- Snapshot output must be identical. A snapshot change means behaviour changed — revert and find out why.
- Per PR: `yarn typecheck`, `yarn jest --findRelatedTests <changed files>`, `yarn lint <changed files>`.
- Also run the tests of the components that _consume_ a migrated component (`git grep -l "from '.*<ComponentDir>'"`) — a changed prop type can break a consumer that `tsc` reports but jest would not.

## 7. Escape hatches

Allowed, temporary, and always tagged so Phase 2 can find them with `git grep -n "TODO(ts-migration)"`.

```ts
// TODO(ts-migration): type once app/util/transactions is migrated (slice A6)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const tx: any = ...;
```

```ts
// TODO(ts-migration): remove when RootState.swaps is typed (slice B1)
// @ts-expect-error swaps slice is `any` on RootState
```

Rules:

- Always `@ts-expect-error` (never `@ts-ignore`) so the marker fails the build once it becomes unnecessary.
- The tag must name the slice or file whose migration will remove it.
- Prefer `unknown` + narrowing over `any` where the value is only passed through.
- Never edit `tsconfig.json` to make a file compile.
- Never disable an ESLint rule for a whole file; use the single-line form shown above.
- Budget: if a file needs more than ~10 escape hatches, stop and check whether a dependency slice should land first.

## 8. Things not to change

- Runtime logic, control flow, hook order, effect dependencies.
- `connect()` → hooks, class → function, default exports → named exports.
- Import order (ESLint will tell you if it matters).
- Dependencies (`package.json`, `yarn.lock`), `patches/`, build/tool configs.
