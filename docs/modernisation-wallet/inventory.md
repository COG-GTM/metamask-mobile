# Wallet modernisation – legacy Redux reducer inventory

Baseline: `687645507a988caba704751354554147e419f21d` (main). Root reducer: `app/reducers/index.ts` (`combineReducers`), store:
`app/store/index.ts` (`configureStore` from `@reduxjs/toolkit` 1.9.7). Existing RTK slices to copy: `app/reducers/banners/index.ts`,
`app/core/redux/slices/*` (e.g. `inpageProvider`).

Counts are from the code at the baseline commit: *cases* = `case` labels in the reducer switch (REHYDRATE included where handled);
*importers* = files under `app/` (excluding the module's own directory, `app/reducers/index.ts` and `app/reducers/__parity__/`)
whose import path ends in that module (`grep -rlE "reducers/<name>['/\"]"`).

## Reducers in scope (22 reducer keys, 12 tickets)

| Ticket | Root key | Reducer module (lang) | Cases | Existing reducer tests | Reducer importers | Action module (lang) | Action importers |
|---|---|---|---|---|---|---|---|
| MW-01 | `transaction` | `app/reducers/transaction/index.js` (JS) | 15 (incl. REHYDRATE) | – | 0 | `app/actions/transaction/index.js` (JS, 14 exports) | 25 |
| MW-02 | `security` | `app/reducers/security/index.ts` (TS switch) | 6 | `index.test.ts` | 2 | `app/actions/security/{index,state}.ts` (TS) | 15 |
| MW-02 | `accounts` | `app/reducers/accounts/index.ts` (TS switch) | 1 | `index.test.ts` | 0 | `app/actions/accounts/index.ts` (TS, + `index.test.ts`) | 4 |
| MW-03 | `settings` | `app/reducers/settings/index.js` (JS) | 10 | – | 0 | `app/actions/settings/index.js` (JS, 11 exports) | 16 |
| MW-04 | `user` | `app/reducers/user/{index,selectors,types}.ts` (TS switch) | 15 | `selectors.test.ts` | 6 | `app/actions/user/{index,types}.ts` (TS) | 26 |
| MW-05 | `onboarding` | `app/reducers/onboarding/index.ts` (TS switch) | 3 | `index.test.ts` | 1 | `app/actions/onboarding/index.ts` (TS, + `index.test.ts`) | 8 |
| MW-06 | `browser` | `app/reducers/browser/index.js` (JS) + `selectors.ts` | 10 | `index.test.js` | 1 | `app/actions/browser/index.js` (JS, 11 exports) | 8 |
| MW-06 | `bookmarks` | `app/reducers/bookmarks/index.js` (JS) | 2 | – | 0 | `app/actions/bookmarks/index.js` (JS, 2 exports) | 4 |
| MW-07 | `notification` | `app/reducers/notification/index.js` (JS; exports `ACTIONS`, selector) | 10 | `notification.test.js` | 2 | `app/actions/notification/index.js` (JS) + `constants/`, `helpers/` (TS) | 10 |
| MW-08 | `collectibles` | `app/reducers/collectibles/index.js` (JS; exports selectors + type constants + 2 creators) | 4 | `index.test.ts` | 14 | `app/actions/collectibles/index.js` (JS, 2 exports) | 5 |
| MW-09 | `modals` | `app/reducers/modals/index.js` (JS) | 5 | – | 0 | `app/actions/modals/index.js` (JS, 5 exports) | 6 |
| MW-09 | `alert` | `app/reducers/alert/index.js` (JS) | 2 | – | 0 | `app/actions/alert/index.js` (JS, 2 exports) | 27 |
| MW-09 | `wizard` | `app/reducers/wizard/index.js` (JS) | 2 (incl. REHYDRATE) | – | 0 | `app/actions/wizard/index.js` (JS, default export) | 14 |
| MW-10 | `privacy` | `app/reducers/privacy/index.js` (JS) | 4 | – | 0 | `app/actions/privacy/index.js` (JS, 3 exports) | 1 |
| MW-10 | `infuraAvailability` | `app/reducers/infuraAvailability/index.js` (JS; exports selectors/constants) | 2 | – | 2 | `app/actions/infuraAvailability/index.js` (JS, 2 exports) | 1 |
| MW-10 | `legalNotices` | `app/reducers/legalNotices/{index,types}.ts` (TS switch; creators live in reducer) | 2 | – | 4 | – (none) | – |
| MW-10 | `signatureRequest` | `app/reducers/signatureRequest/index.ts` (TS switch) | 1 | – | 0 | `app/actions/signatureRequest/index.ts` (TS, default export) | 3 |
| MW-11 | `rpcEvents` | `app/reducers/rpcEvents/index.ts` (TS switch) | 3 | `index.test.ts` | 6 | `app/actions/rpcEvents/index.ts` (TS, + `index.test.ts`) | 6 |
| MW-11 | `sdk` | `app/reducers/sdk/index.ts` (TS switch) | 12 | – | 0 | `app/actions/sdk/{index,state}.ts` (TS) | 12 |
| MW-12 | `networkOnboarded` | `app/reducers/networkSelector/index.ts` (TS switch) | 3 | – | 0 | `app/actions/onboardNetwork/index.ts` (TS) | 5 |
| MW-12 | `experimentalSettings` | `app/reducers/experimentalSettings/index.ts` (TS switch) | 1 | – | 0 | `app/actions/experimental/index.ts` (TS) | 1 |
| MW-12 | `navigation` | `app/reducers/navigation/{index,selectors,types}.ts` (TS switch) | 2 | – | 2 | `app/actions/navigation/{index,types}.ts` (TS) | 5 |

Totals: 22 reducer keys, 115 handled `case` labels, 11 of them in plain JS reducers (transaction, settings, browser, bookmarks,
notification, collectibles, modals, alert, wizard, privacy, infuraAvailability) that are typed `any` in `RootState`; the other 11
are TypeScript but still hand-written `switch` reducers. Only `transaction` and `wizard` handle `persist/REHYDRATE`.

Out of scope: `app/reducers/swaps`, `app/reducers/fiatOrders` (thunk/API heavy), `engine` (controller background state), the
existing RTK slices (`banners`, `inpageProvider`, `bridge`, `notifications`, ...), and all UI components.

### Behaviour quirks the parity transcripts pin down
- `SET_TRANSACTION_OBJECT` mutates `action.transaction` (deletes `selectedAsset`, sets `assetType`); recorded as `actionAfter`.
- `collectibles` ADD/REMOVE mutate arrays reached from the input state; REMOVE of an unknown NFT splices index `-1` (drops the last item).
- `notification` `modifyOrShow*ById` creators do not put `id` on the action; the reducer then matches id-less notifications.
- `user` ignores `CHECKED_AUTH` / `ON_PERSISTED_DATA_LOADED`; `sdk` ignores `RESET_APPROVED_HOSTS`; `security` ignores
  `SET_MULTI_RPC_MIGRATION_MODAL_OPEN`; `settings` ignores `SET_TOKEN_SORT_CONFIG`; `experimentalSettings` ignores
  `SET_PPOM_INITIALIZATION_STATUS` (unknown actions keep the same state reference).
- `rpcEvents` only reacts to whitelisted signing RPC names; `legalNotices` stores the first shown date only.

## Why Redux Toolkit slices are the highest-value demoable migration
1. **Core wallet state, zero UI risk.** Transactions, security, settings, accounts, browser and onboarding state all live in these
   reducers; every screen reads them, yet reducers are pure functions, so the change is invisible to users.
2. **Provable parity.** Pure reducers can be replayed: the same action transcript on the same seed must produce the same state.
   `app/reducers/__parity__/` records 22 per-reducer and 13 user-flow transcripts on the legacy code and replays them on every
   Jest run, so each ticket proves byte-for-byte equivalence rather than asserting it.
3. **Finishes a half-done migration.** The store already uses `configureStore` and seven slices exist; 22 reducers still use the
   pre-RTK pattern, 11 in untyped JS surfaced as `any` in `RootState`. Converting them removes `any`, gains Immer immutability
   and devtools-friendly typed state, and leaves one consistent pattern.
4. **Parallelisable.** Each reducer/action pair is an independent module with disjoint files, so 12 tickets can run concurrently and
   merge in waves with no conflicts (root reducer and tests untouched).
5. **Bank-relevant story.** It mirrors a typical banking-app estate (legacy state handling, compliance-driven need for evidence):
   modernise the core while proving no behavioural change, backed by recorded transcripts and an unchanged test baseline.
