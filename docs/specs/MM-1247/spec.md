# MM-1247 — Consistent copy-to-clipboard confirmation

Repository: COG-GTM/metamask-mobile (base `main`, spec written against `687645507a`)

## Problem

Copying text — most visibly a wallet address — confirms differently depending on which screen the
user is on, and on some screens it does not confirm at all. Users re-tap copy because they cannot
tell whether the copy worked.

Five distinct mechanisms exist today:

1. **Redux `showAlert({content: 'clipboard-alert'})` → `app/components/UI/GlobalAlert`** — a centred
   `react-native-modal` card with a FontAwesome check, auto-dismiss 1500ms. ~20 call sites
   (`AddressCopy`, `DrawerView`, `ReceiveRequest`, `AddressQRCode`, `PaymentRequestSuccess`,
   `AccountOverview`, `AssetDetails`, `NftDetails`, `DetectedTokens/Token`, `TokenDetailsList`,
   legacy confirmations, `RevealPrivateCredential`, `useCopyClipboard`).
   **`GlobalAlert` is not globally mounted** — it is rendered per-screen in `Nav/Main` and seven other
   components, so any surface that dispatches `showAlert` outside those trees shows nothing. This is
   the primary root cause of "silently succeeds".
2. **Design-system `Toast`** (`app/component-library/components/Toast`) — bottom-anchored, 2750ms,
   mounted exactly once at `app/components/Nav/App/App.tsx:999` inside the app-wide
   `ToastContextWrapper` (`app/components/Views/Root/index.tsx`). Used by exactly one copy site:
   `QRAccountDisplay`.
3. **In-place icon swap** — `confirmations/components/UI/copy-button` toggles `IconName.Copy` →
   `IconName.CopySuccess` and never resets.
4. **Nothing at all** — `confirmations/components/UI/info-row/copy-icon`,
   `AesCryptoTestForm/Clipboard.tsx`.
5. **Native `Alert.alert`** — `app/components/Views/ErrorBoundary/index.js`.

Wording is inconsistent too: four near-duplicate i18n keys say the same thing
(`account_details.account_copied_to_clipboard` = "Public address copied to clipboard",
`notifications.address_copied_to_clipboard` = "Address copied to clipboard",
`transaction.address_copied_to_clipboard` = "Address copied to clipboard",
`asset_details.address_copied_to_clipboard` = "Token address copied to clipboard").

## Goals

- One confirmation affordance for every user-initiated copy in the app: the design-system `Toast`.
- One shared code path (`useCopyToClipboard`) that performs the clipboard write and then confirms, so
  no future copy site can silently succeed.
- Confirmation is announced to screen readers.
- No regression to the side effects currently coupled to copying (wallet-backup nudge, MetaMetrics
  events, modal auto-close timers, 60s clipboard expiry for secrets).

## Non-goals

- Deleting `GlobalAlert` or the `alert` Redux slice. `content: 'clipboard-alert'` is also used for
  non-copy messages (`DeeplinkManager/Handlers/switchNetwork.ts` network-change warning,
  `confirmations/legacy/Send/index.js` deeplink failure), so the component stays. Only copy paths stop
  using it. Renaming the misleading `'clipboard-alert'` content type is a follow-up.
- Migrating `ClipboardManager.js` (or any other touched `.js` file) to TypeScript — see JS→TS
  Playbook 4.
- Changing what gets copied, or adding copy affordances where none exist.
- The `AesCryptoTestForm` developer surface and `ErrorBoundary`'s native `Alert.alert` (not a copy
  confirmation; it is a share/copy error dialog).
- Consolidating the four duplicate i18n keys into one key (see Decisions §8).

## Proposed behaviour

### New shared hook

`app/components/hooks/useCopyToClipboard.ts` (`.ts`, per the app TS gate):

```ts
type CopyOptions = {
  /** Confirmation text. Defaults to strings('notifications.copied_to_clipboard'). */
  message?: string;
  /** Use ClipboardManager.setStringExpire (60s clear) instead of setString. */
  expire?: boolean;
  /** Dispatch protectWalletModalVisible() 2s after a successful copy. */
  promptWalletBackup?: boolean;
};

function useCopyToClipboard(): (value: string, options?: CopyOptions) => Promise<boolean>;
```

Behaviour:

1. No-op returning `false` when `value` is empty.
2. `await ClipboardManager.setString(value)` (or `setStringExpire` when `expire`).
3. **Only after the write resolves**, show the toast via `ToastContext`:
   `{ variant: ToastVariants.Plain, labelOptions: [{ label: message, isBold: false }], hasNoTimeout: false }`.
4. If the write rejects: log via `Logger.error`, show **no** toast, return `false`.
5. When `promptWalletBackup`, dispatch `protectWalletModalVisible()` after 2s (unchanged timing).
6. Never dispatch analytics — call sites keep their own `trackEvent`.

For the ~7 legacy class components (`DrawerView`, `ReceiveRequest`, `AddressQRCode`,
`PaymentRequestSuccess`, `AccountOverview`, legacy `SendFlow/Confirm`, `ApproveTransactionReview`,
plus `AddNickname`/`TransactionReviewData`), ship `withCopyToClipboard(Component)` in the same module:
a function-component wrapper that calls the hook and injects `copyToClipboard` as a prop. One
implementation, two entry points.

`app/components/Views/Notifications/Details/hooks/useCopyClipboard.ts` becomes a thin re-export of the
new hook (it is imported cross-feature by `ImportNewSecretRecoveryPhrase`), preserving
`CopyClipboardAlertMessage`.

### Wording

Reuse existing, already-translated keys — no new i18n keys, no key deletions:

| Copied content | Key | English |
| --- | --- | --- |
| Any address (account, contract, token, recipient) | `notifications.address_copied_to_clipboard` | Address copied to clipboard |
| Transaction ID / hash | `notifications.transaction_id_copied_to_clipboard` | Transaction ID copied to clipboard |
| Anything else (hex data, memo, error text) | `notifications.copied_to_clipboard` | Copied to clipboard |
| SRP | `reveal_credential.seed_phrase_copied_ios` / `_android` (+ `_copied_time`) | unchanged |
| Private key | `reveal_credential.private_key_copied_ios` / `_android` (+ `_copied_time`) | unchanged |

The three per-context keys that lose their last caller (`account_details.account_copied_to_clipboard`,
`transaction.address_copied_to_clipboard`, `asset_details.address_copied_to_clipboard`) stay in
`en.json` and in the 22 managed locale files; removal is a follow-up chore.

### Accessibility

The shared `Toast` gains `accessibilityRole="alert"` and `accessibilityLiveRegion="polite"` on its
container, plus an `AccessibilityInfo.announceForAccessibility(label)` call when the toast is shown
(iOS has no live-region support). This applies to all toasts app-wide, not only copy toasts.

### Surfaces converted

Every `content: 'clipboard-alert'` dispatch that confirms a **copy** switches to the hook/HOC
(`AddressCopy`, `DrawerView`, `ReceiveRequest`, `AddressQRCode`, `PaymentRequestSuccess`,
`AccountOverview`, `AssetDetails`, `NftDetails`, `DetectedTokens/Token`, `TokenDetailsList`,
`useCopyClipboard`, `RevealPrivateCredential`, legacy `SendFlow/Confirm`, `SendFlow/SendTo`,
`SendFlow/AddressTo`, `ApproveTransactionReview`, `AddNickname`, `TransactionReviewData`), plus the
two currently-silent/bespoke confirmations surfaces (`info-row/copy-icon`, `copy-button`).
`QRAccountDisplay` switches from its inline toast call to the hook, which fixes its
confirm-before-write ordering bug.

`copy-button` keeps its `Copy → CopySuccess` icon swap *in addition to* the toast, and resets the icon
after 2750ms so a second copy is visibly acknowledged.

## Acceptance criteria

1. `app/components/hooks/useCopyToClipboard.ts` exists, exports the hook and
   `withCopyToClipboard`, and is written in TypeScript (`yarn --cwd .github/scripts run check-ts-app-gate` passes).
2. The hook writes to the clipboard through `ClipboardManager` and shows the toast **only after** the
   write promise resolves (unit test: toast mock not called until the deferred `setString` resolves).
3. On a rejected clipboard write the hook shows no toast, logs the error, and returns `false`.
4. Copying an address on each of these surfaces shows the bottom design-system toast reading
   "Address copied to clipboard": Wallet account (`AddressCopy`), `WalletAccount`, `DrawerView`,
   `ReceiveRequest`, `AddressQRCode`, `QRAccountDisplay`, `AssetDetails`, `NftDetails`,
   `DetectedTokens/Token`, `TokenDetailsList`, `PaymentRequestSuccess`, `AccountOverview`, legacy
   `SendFlow` (`Confirm`, `SendTo`, `AddressTo`), `ApproveTransactionReview`, `AddNickname`.
5. No copy path dispatches `showAlert({ content: 'clipboard-alert' })` any more:
   `grep -rn "clipboard-alert" app/` returns only `GlobalAlert/index.js`,
   `DeeplinkManager/Handlers/switchNetwork.ts` and `confirmations/legacy/Send/index.js` (+ their tests).
6. `confirmations/.../info-row/copy-icon` shows the toast (was silent); `confirmations/.../copy-button`
   shows the toast **and** swaps to `IconName.CopySuccess`, reverting to `IconName.Copy` after 2750ms.
7. Copying a transaction ID/hash shows "Transaction ID copied to clipboard"; copies with no specific
   category show "Copied to clipboard". No new i18n keys are added to `locales/languages/en.json`.
8. SRP and private-key copies still use `ClipboardManager.setStringExpire`, still show their existing
   platform-specific `reveal_credential.*` strings (now rendered in the toast), and the confirmation
   text never contains any part of the copied secret.
9. The toast container renders with `accessibilityRole="alert"` and `accessibilityLiveRegion="polite"`,
   and `AccessibilityInfo.announceForAccessibility` is called with the toast label on show (unit test
   asserts the spy).
10. Existing side effects are unchanged: `protectWalletModalVisible()` still fires ~2s after copy on
    `AddressCopy`, `ReceiveRequest`, `DrawerView` and `useCopyClipboard` callers and nowhere new; the
    `WALLET_COPIED_ADDRESS`, `CONTRACT_ADDRESS_COPIED` and `COPY_SRP` MetaMetrics events still fire from
    their existing call sites; `ReceiveRequest`/`AddressQRCode` still close on their post-copy timers.
11. `GlobalAlert` and the `alert` Redux slice still exist and still render for
    `switchNetwork`/`Send` deeplink messages.
12. `yarn lint`, `yarn test`, `(cd .github/scripts && yarn lint && yarn lint:tsc && yarn test)` pass;
    snapshots touched by the change (`QRAccountDisplay`, `DetectedTokens/Token`, `WalletAccount`,
    `GlobalAlert`, `copy-button`) are updated deliberately, not blanket-regenerated.
13. Detox specs `e2e/specs/accounts/reveal-private-key.spec.js` and
    `reveal-secret-recovery-phrase.spec.js` are updated to assert the copy through the existing
    `e2e/pages/wallet/ToastModal.js` page object (testID `toast`) instead of the modal alert, and the
    asserted strings are the unchanged `reveal_credential.*` values.
14. The PR description ends with the line `Devin-Org: engineering`.

## Decisions

### 1. Primitive: the design-system `Toast`, not `GlobalAlert`

**Decision.** Standardize on `app/component-library/components/Toast` via `ToastContext`.

**Why.** It is the only confirmation primitive that is globally mounted (one `<Toast>` at
`Nav/App/App.tsx:999` under the app-wide `ToastContextWrapper`), so a call site cannot "forget" to
render it — which is exactly the bug behind the reported inconsistency, since `GlobalAlert` is mounted
ad hoc in eight components. It is also the sanctioned app-wide notification affordance already used for
network changes, connect/revoke, browser tab limits and detection modals, and it is the design-system
component; `GlobalAlert` is a 2019 `PureComponent` (PR #322) styled with raw `StyleSheet` +
FontAwesome.

**Alternatives considered.** (a) Standardize on `GlobalAlert` and mount it once globally: smaller
per-call-site diff and preserves current position/timing, but doubles down on a legacy component
outside the design system and on a centred modal that overlays content. (b) Push the confirmation into
`ClipboardManager` itself: it is a plain module with no React context, so it cannot render — rejected.

**Risk accepted.** Position moves from centre to bottom (offset by `TAB_BAR_HEIGHT`) and duration goes
1500ms → 2750ms. Toast has previously caused Detox flakiness (`8aece87737`, `cf218134d6`,
`8dc1c9fcfb` "alert toast blocking tab navigation"), and `Toast` lives under the nav tree, so z-order
above `react-native-modal` bottom sheets must be verified per surface during implementation
(`ReceiveRequest`, `AddressQRCode`, `RevealPrivateCredential`, `AddNickname` are the modal surfaces).

### 2. `GlobalAlert` is not deleted

**Decision.** Leave `GlobalAlert` and the `alert` slice in place; only remove copy usage.

**Why.** `content: 'clipboard-alert'` is not copy-only: `switchNetwork.ts` uses it for the
network-change warning (5000ms) and legacy `Send/index.js` for deeplink failure. Deleting it would
silently drop those messages. Stage 1 reported clipboard-alert as GlobalAlert's only content case; that
is true of the *string* but not of its *uses*, hence the divergence from that note.

**Alternative.** Migrate those two messages to Toast as well and delete `GlobalAlert` — cleaner, but it
drags unrelated deeplink/network flows into a copy-consistency change. Follow-up.

### 3. Toast variant: `ToastVariants.Plain`

**Decision.** Text-only `Plain`, matching `QRAccountDisplay`.

**Why.** `Plain` is what the only existing copy toast uses and what most app toasts use, so nothing on
screen looks bespoke. `ToastVariants.Icon` renders an `Avatar` with an icon and requires picking icon,
icon colour and background colour per theme — a visual decision with no design source in-repo (the
Toast README links an internal Notion page that is not accessible here). Text is the accessible signal;
the check mark in `GlobalAlert` is decorative.

**Alternative.** `ToastVariants.Icon` + `IconName.CopySuccess` to preserve the check-mark semantics —
reconsider if design supplies a spec.

### 4. The confirmation does **not** include the truncated address

**Decision.** "Address copied to clipboard", no address echo.

**Why.** Echoing requires a new i18n key with interpolation; only `locales/languages/en.json` is
authored in this repo and the other 22 locales are translation-managed, so the string would ship
English-only for every non-English user — a visible regression against the current fully-translated
strings, in a change whose entire point is consistency. The repo also has three competing truncation
helpers (`formatAddress(addr, 'short')`, `renderShortAddress`, and QRAccountDisplay's hard-coded 6/5
split), and checksum-cased truncations are easy to misread.

**Counter-argument acknowledged.** On screens listing several accounts, an echo tells the user *which*
address was copied. If product wants it, the follow-up is one interpolated key
(`Copied {{address}}`) plus `formatAddress(address, 'short')` as the single helper — the hook signature
already supports it via `message`.

### 5. Scope: all copies, secrets included, with their own wording

**Decision.** Every user-initiated copy in `app/` confirms via the toast: addresses, transaction
IDs/hashes, hex data, error/memo text, contract addresses, SRP and private key. Secrets keep
`setStringExpire` and their existing platform-specific strings, which are the only place the 60s expiry
is communicated.

**Why.** The ticket asks for one affordance "whenever an address is copied", but the silent
`info-row/copy-icon` case is the clearest instance of the reported bug and lives on the same screens as
address copies; fixing addresses only would leave two behaviours side by side. Secrets get the same
primitive (consistency) but not the same words (they must convey expiry), and never the copied value.

**Excluded.** `AesCryptoTestForm/Clipboard.tsx` (developer-only surface) and `ErrorBoundary`'s
`Alert.alert` (an error dialog, not a copy confirmation).

**Risk.** `RevealPrivateCredential` currently passes `data.width: '70%'` to size its alert; `Toast` has
no width option and will render full-width. Accepted as a visual change.

### 6. `copy-button` keeps its icon swap *and* gains the toast

**Decision.** Both, plus a 2750ms reset of the icon.

**Why.** The icon swap is in-context feedback the confirmations team deliberately built (it has its own
test); removing it is a UX regression in the new confirmations stack. Adding the toast is what makes
the behaviour consistent with the rest of the app. The current never-resetting icon means a second copy
of a *different* value gives no feedback at all — resetting is required for the affordance to be
truthful, and matches the toast duration.

### 7. Screen-reader announcement is required, and lands in `Toast`

**Decision.** Yes. Implement in the shared `Toast` component:
`accessibilityRole="alert"` + `accessibilityLiveRegion="polite"` (Android) and
`AccessibilityInfo.announceForAccessibility(label)` on show (iOS + Android).

**Why.** A confirmation that a sighted user gets and a VoiceOver/TalkBack user does not is the same
bug the ticket describes. Nothing in `app/` uses any of these APIs today, so this is new ground; putting
it in `Toast` rather than in the copy path means every toast (network change, connect/revoke) becomes
announced, which is the correct default for a transient message that is never focusable.
`accessibilityLiveRegion` is Android-only, hence the explicit `announceForAccessibility` call for iOS
parity.

**Alternative.** Announce only from the copy hook — narrower blast radius, but leaves the shared
component inaccessible and duplicates the concern at every future call site.

### 8. i18n: reuse existing keys, do not consolidate

**Decision.** Route everything through the three already-translated `notifications.*` keys; leave the
now-unused per-context keys in place.

**Why.** Adding keys ships untranslated English to 22 locales; deleting keys touches 22 managed locale
files and any e2e selector that reads `enContent`. Reuse achieves the user-visible goal (one wording)
with zero translation debt. `notifications.address_copied_to_clipboard` is the canonical address string
because it is already the one used by the reference Toast implementation
(`QRAccountDisplay`) and is context-neutral.

**Cost accepted.** The `notifications.*` namespace is now a misnomer for app-wide strings; renaming the
namespace is a mechanical follow-up across all locale files.

### 9. Side effects stay at call sites; the hook only opts in to the backup nudge

**Decision.** The hook owns copy + confirmation, and — behind the explicit `promptWalletBackup` flag —
the `protectWalletModalVisible()` nudge. MetaMetrics stays at call sites.

**Why.** The nudge is genuinely coupled to the copy (it must fire ~2s after a *successful* copy, and
today four call sites duplicate the same `setTimeout`), but it is only wanted for the user's own wallet
address — firing it on a contract address or tx hash copy would be a new, wrong nudge. An explicit flag
keeps the timing logic in one place without making it the default. Analytics events differ per call
site in name and properties (`WALLET_COPIED_ADDRESS`, `CONTRACT_ADDRESS_COPIED`, `COPY_SRP`,
`REVEAL_*_COMPLETED`) and several carry surface-specific properties, so bundling them would just push a
discriminator parameter into the hook.

### 10. Legacy class components: an HOC over the same hook

**Decision.** `withCopyToClipboard(Component)` injecting a `copyToClipboard` prop, exported from the
hook module.

**Why.** Nine legacy class components cannot call a hook. The alternatives are `static contextType =
ToastContext` per class (works, but re-implements the write/ordering/nudge logic nine times, which is
how the current inconsistency arose) or converting the classes to function components (a much larger,
riskier change that belongs to the JS→TS/refactor track). The HOC keeps exactly one implementation and
leaves the classes otherwise untouched.

### 11. Coverage bar: all production copy sites in one change

**Decision.** Convert every production copy site now, rather than addresses-first with a follow-up.

**Why.** The ticket's complaint is the *mix* of behaviours; a partial rollout keeps the mix and needs a
second round of the same snapshot/e2e churn. The mechanical work is bounded (~20 call sites, all
one-line swaps once the hook and HOC exist), and the main effort driver — the legacy class components —
is paid once by the HOC.

## Open questions

1. **Design sign-off on position, duration and iconography.** Nothing in-repo defines the copy
   confirmation; the Toast README points to an internal Notion page that is not reachable from this
   environment. The spec adopts Toast's existing 2750ms bottom-anchored `Plain` presentation. If design
   has an existing spec (icon variant, shorter duration, address echo), decisions §3 and §4 flip.
2. **Product call on echoing the truncated address**, accepting English-only text until translations
   land (decision §4). Blocking only if product wants it in this change.
3. **Toast z-order above `react-native-modal` surfaces** (`ReceiveRequest`, `AddressQRCode`,
   `RevealPrivateCredential`, `AddNickname`) cannot be settled from source; it needs a device/emulator
   check during implementation. If the toast renders behind a native modal on iOS, those surfaces need a
   different treatment (e.g. show the toast after the modal's existing auto-close timer).
