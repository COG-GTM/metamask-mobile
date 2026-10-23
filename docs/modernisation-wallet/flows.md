# Wallet modernisation – user flows and parity transcripts

Each user flow below is recorded on the legacy code (commit `687645507a988caba704751354554147e419f21d`) as a store-level
transcript: the action sequence is dispatched through the real root reducer (`app/reducers/index.ts`) from one fixed seed
(`app/util/test/initial-root-state` with every `undefined` slice initialised), and the full non-`engine` root state is recorded
after every step. `app/reducers/__parity__/transcripts.parity.test.ts` replays each transcript on the current code and compares
every step with `toStrictEqual` (keys holding `undefined` included, via a sentinel), plus whether the reducer returned the same
state reference and whether it mutated the dispatched action.

Re-record (legacy code only): `RECORD_TRANSCRIPTS=1 yarn jest app/reducers/__parity__ --coverage=false`

The Android steps are for the UI testing agent: run them on the legacy build and on the migrated build and compare.

| # | Flow | Transcript | Reducers exercised | Android UI steps |
|---|------|------------|--------------------|------------------|
| 1 | Cold start / rehydrate | `flow.app-start-rehydrate.json` | transaction, wizard (REHYDRATE), user | Install, create or import a wallet, force-stop the app, relaunch; the lock screen appears and, after unlock, settings (e.g. auto-lock, currency) persist. |
| 2 | Onboarding + wallet creation | `flow.onboarding-wallet-creation.json` | onboarding, security, user, wizard, accounts | Fresh install → Get started → Create a new wallet → accept/decline metrics → set password → Secure wallet → reveal and confirm SRP → Done → wallet home (onboarding wizard / NFT auto-detection sheet may show). |
| 3 | Lock / unlock + login | `flow.lock-unlock-login.json` | user, navigation | Settings → Security & Privacy → Auto-lock "Immediately"; background then foreground the app → lock screen; enter a wrong password (error), then the correct one → wallet home. Settings → Lock → unlock again. |
| 4 | Settings: currency, privacy, basic functionality | `flow.settings-currency-privacy-basic-functionality.json` | settings, user, privacy | Settings → General: primary currency Fiat/Native, hide tokens without balance, search engine DuckDuckGo, account identicon, theme Dark. Settings → Advanced: show hex data, customise nonce, show conversion on test networks. Settings → Security & Privacy: Basic functionality off (confirm) then on; Clear privacy data; Reveal SRP. Settings → Notifications toggle. |
| 5 | Browser tab + bookmark | `flow.browser-tab-bookmark.json` | browser, bookmarks, navigation | Bottom nav Browser → open `app.uniswap.org` → ⋮ Add to Favorites → navigate to `opensea.io` → Tabs → new tab / close tab → close all; Explore favourites → remove bookmark. Settings → Security & Privacy → Clear browser history. |
| 6 | Send-ETH transaction lifecycle | `flow.send-eth-transaction-lifecycle.json` | transaction, notification | Wallet → Send → choose recipient (Account 2) → enter amount, tap Max then un-Max → Next → Edit nonce (Advanced setting enabled) → Confirm/Reject → pending notification toast; repeat Send with an ERC-20 token; a dapp-initiated `eth_sendTransaction` from the browser. Back out resets the send state. |
| 7 | Security alerts (Blockaid) | `flow.security-alerts.json` | experimentalSettings, transaction, signatureRequest, security | Settings → Security & Privacy → Security alerts on. In the browser open a test dapp and trigger a malicious transaction and a malicious signature → red "This is a deceptive request" banner on the confirmation; reject; toggle security alerts off. |
| 8 | Notifications | `flow.notifications.json` | notification | Copy the account address (simple toast), send a transaction (pending → confirmed toast), add a network (success toast); let toasts auto-dismiss or swipe them away. |
| 9 | Network selector / network onboarding | `flow.network-selector-onboarding.json` | modals, networkOnboarded, infuraAvailability | Tap the network picker → choose / add Polygon → the "You're now using Polygon" onboarding sheet → Got it; open the network info modal; (Infura-blocked state is shown in regions where Infura is unreachable). |
| 10 | SDK / WalletConnect connections | `flow.sdk-walletconnect-connections.json` | sdk | Scan a WalletConnect v2 QR (e.g. OpenSea) or open a MetaMask SDK deeplink → approve connection → Settings → Experimental → SDK connections lists it → disconnect / disconnect all. |
| 11 | RPC events (signature tracking) | `flow.rpc-events.json` | rpcEvents | In the browser on a test dapp request `personal_sign` → Sign; request `eth_signTypedData_v4` → Reject. |
| 12 | Legal notices | `flow.legal-notices.json` | legalNotices | On a wallet that has not dismissed it, the "We've updated our privacy policy" toast appears once on wallet home; tap it or close it and it does not reappear. |
| 13 | Modals / alerts / collectibles | `flow.modals-alerts-collectibles.json` | alert, modals, collectibles | Tap the account address to copy it (clipboard alert); open a dapp transaction / signature modal and dismiss; NFTs tab → open an NFT → favourite / unfavourite; pull-to-refresh NFTs (fetching loader). |

Per-reducer transcripts (`reducer.<key>.json`, one per in-scope reducer key) cover every handled action type through the real
exported action creators (or literals where no creator exists), from both the initial state and a realistic seed, plus an
unknown action (must return the same reference) and a redux-persist `persist/REHYDRATE` action.
