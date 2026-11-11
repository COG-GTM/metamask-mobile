# Threat model — COG-GTM/metamask-mobile

Status: built from the code (commit 6876455) plus the user's answers (2026-11-11). No `SECURITY_MODEL.md` exists in the repo. Items marked **[user]** come from the user; everything else is the drafter's reading of the code.

- **[user]** No infrastructure repository: this is a client-only mobile app.
- **[user]** This is a COG-GTM demo fork, not production MetaMask Mobile; real-world exploitability matters less. Recorded as context only — it does not by itself downgrade findings (all attackers remain in scope).

## System overview
React Native (Hermes) self-custodial wallet + in-app dApp browser for iOS and Android. All key material lives on the device. `app/core/Engine` instantiates the MetaMask controllers (Keyring, Network, Transaction, Signature, Permission, Snaps, Accounts, Assets, Bridge/Swaps, Notifications, Profile-sync, …) and wires them via restricted messengers. UI is in `app/components`, state in Redux (`app/store`, `app/reducers`, `app/selectors`) persisted to device storage.

## Components
| Name | Covers | Trust boundary |
|---|---|---|
| **Vault & Keys** | `app/core/Vault.js`, `app/core/Encryptor/`, `app/core/SecureKeychain.js`, `app/core/Authentication/`, `app/core/BackupVault/`, `app/core/LockManagerService/`, `app/core/Ledger/`, keyring wiring in `app/core/Engine/`, onboarding/SRP views (`app/components/Views/*Onboarding*`, `ImportFromSecretRecoveryPhrase`, `RevealPrivateCredential`, `ManualBackupStep*`) | Holds SRP/private keys; only the device owner (password/biometrics) should reach it |
| **dApp Browser & RPC** | `app/components/Views/BrowserTab/`, `app/components/Views/Browser/`, `app/core/BackgroundBridge/`, `app/core/EntryScriptWeb3.js`, `app/core/MobilePortStream.js`, `app/core/RPCMethods/`, `app/core/Permissions/`, `app/core/SanitizationMiddleware.ts`, `app/util/middlewares` | Untrusted web content → wallet provider (EIP-1193). Origin is derived from the WebView URL |
| **Remote Connections** | `app/core/SDKConnect/` (incl. `AndroidSDK`, `ECIES`), `app/core/WalletConnect/`, `app/core/DeeplinkManager/`, `app/core/BackgroundBridge/RemotePort.ts`/`WalletConnectPort.ts`, QR scanner | Untrusted remote dApps, other apps on the device, deeplinks/universal links/QR codes |
| **Snaps** | `app/core/Snaps/`, `app/core/SnapKeyring/`, `app/core/Engine/controllers/snaps/`, `app/core/Multichain/` | Third-party Snap code (Flask / preinstalled) ↔ wallet APIs and keyrings |
| **Transactions & Signing** | `app/components/Views/confirmations/`, `app/core/Transaction/`, `app/core/Engine/controllers/transaction-controller/`, `signature-controller/`, `app/util/transactions/`, `ppom/` (Blockaid), `app/core/GasPolling/` | What the user sees vs. what is signed/broadcast |
| **Integrations & Services** | `app/components/UI/Ramp/`, `UI/Swaps`, `UI/Bridge`, `UI/Earn`/Stake, notifications & identity controllers, `app/core/Analytics/`, `app/util/sentry`, remote feature flags | Third-party HTTPS APIs (ramp providers, swaps/bridge aggregators, Infura/RPC, Sentry, Segment) |
| **Native Platform** | `android/` (AndroidManifest, Java/Kotlin modules), `ios/` (Info.plist, native modules), `app/core/NativeModules.ts` | OS: exported activities/intent filters, URL schemes, backup, screenshots, clipboard |
| **Build & CI** | `.github/workflows/`, `bitrise.yml`, `scripts/`, `patches/`, `e2e/`, `wdio/`, `app.config.js`, `metro*.js` | CI secrets, release signing, dependency patches; test code never ships |

## Entry points and who reaches them
- **In-app browser**: any website the user opens can call `window.ethereum` (injected via `injectedJavaScriptBeforeContentLoaded` → `onMessage` → `BackgroundBridge` → `RPCMethodMiddleware`). Permissions are gated by `PermissionController` keyed on the hostname/origin.
- **Deeplinks / universal links**: `metamask://`, `ethereum:`, `dapp://`, `wc:`, `https://metamask.app.link/...` (`AndroidManifest.xml` exported activity, iOS URL types) → `DeeplinkManager` handlers (browser URL, send/approve ERC-681, ramp, switch network, SDK connect, WalletConnect pairing).
- **MetaMask SDK**: remote dApps over the socket relay (ECIES-encrypted channel) and Android native SDK via bound service (`AndroidSDK`).
- **WalletConnect v2**: paired dApps send session requests.
- **Snaps**: installed Snaps call wallet/keyring APIs.
- **Network responses**: RPC endpoints (incl. user-added custom networks via `wallet_addEthereumChain`), token lists, prices, ramp/swap quotes, remote feature flags.
- **Device-local**: physical access to the phone, other apps (clipboard, intents), OS backups.

## Assets (sensitivity)
1. SRP / private keys / vault password — critical (direct loss of funds).
2. Transaction & signature integrity — critical (user signs something other than what is shown, or without consent).
3. Account ↔ dApp privacy (which addresses are exposed to which origin) — high.
4. Session/auth tokens for profile-sync, notifications, ramp accounts — medium/high.
5. Persisted wallet state (address book, networks, permissions) — medium.
6. Analytics/telemetry (must not leak addresses/SRP) — medium.

## Attacker profiles
**[user]** All of the profiles below are in scope (user selected "All of them", explicitly calling out A1, A3 and A4).
- A1 Malicious website/dApp in the in-app browser.
- A2 Malicious deeplink / QR code / co-installed app.
- A3 Malicious remote peer over MetaMask SDK or WalletConnect (incl. a compromised relay).
- A4 Malicious or compromised Snap.
- A5 Network attacker or compromised third-party API / malicious custom RPC.
- A6 Physical access to the device (locked or briefly unlocked).
- A7 Supply chain / CI (dependencies, `patches/`, GitHub Actions, Bitrise).

## Existing controls (from the code)
- Vault encrypted with PBKDF2 (900k iterations default, legacy 5k still supported for old vaults) — `app/core/Encryptor/constants.ts`.
- Password stored in Keychain/Keystore with `WHEN_UNLOCKED_THIS_DEVICE_ONLY`, biometry/passcode access control — `app/core/SecureKeychain.js`.
- `android:allowBackup="false"`; cleartext traffic only in debug builds — `AndroidManifest.xml`.
- Permission system (CAIP-25) for account exposure; `SanitizationMiddleware`; unsupported-method middleware.
- Blockaid/PPOM transaction & signature simulation; phishing detection; spam filter for dApp prompts (`RPCMethods/spam.ts`).
- SDK channel uses ECIES; WalletConnect sessions require approval.
- Auto-lock (`LockManagerService`), screenshot prevention on SRP screens (`PreventScreenshot.js`).

## Out of scope / accepted risk [user]
- Test & tooling code: `e2e/`, `wdio/`, `scripts/` (and test files/mocks such as `*.test.*`, `__mocks__/`). Never ships in the app.
- Rooted / jailbroken devices: issues that require root/jailbreak to exploit are accepted risk.
- Flask / experimental-only features: code only reachable in Flask or experimental builds (e.g. `///: BEGIN:ONLY_INCLUDE_IF(flask...)` / external-snaps-only paths) is out of scope. Preinstalled Snaps in the main build remain in scope.
- Debug-only build settings: anything only active in debug/dev builds (e.g. `usesCleartextTraffic="${isDebug}"`, `__DEV__`-gated code) is out of scope.

## Open questions
- Which assets matter most (user did not rank them; the order above is the drafter's).
- Should "demo fork" lower priorities across the board? (Currently: no.)
