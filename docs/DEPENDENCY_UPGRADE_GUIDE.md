# Dependency Upgrade Guide for Devin

> **Purpose:** This document is a comprehensive reference for performing dependency upgrades in the MetaMask Mobile codebase. Follow these instructions when upgrading any `@metamask/*`, `react-native`, or third-party package to ensure nothing breaks.

---

## Table of Contents

1. [Engine — Controller Composition Layer](#1-engine--controller-composition-layer)
2. [State Migrations](#2-state-migrations)
3. [Patches](#3-patches)
4. [Resolutions](#4-resolutions)
5. [Polyfill / Shim Layer](#5-polyfill--shim-layer)
6. [Native Platform Configs](#6-native-platform-configs)
7. [RPC Method Middleware & dApp Connectivity](#7-rpc-method-middleware--dapp-connectivity)
8. [Security & Encryption](#8-security--encryption)
9. [Summary Table](#9-summary-table)

---

## 1. Engine — Controller Composition Layer

**File:** `app/core/Engine/Engine.ts`

This is the central singleton that imports and instantiates 30+ `@metamask/*` controllers (KeyringController, TransactionController, NetworkController, SignatureController, etc.).

### What to check when upgrading `@metamask/*` controllers:

- **Constructor signatures:** Verify that each controller's constructor arguments still match what `Engine.ts` passes. Look for renamed, added, or removed options.
- **Initialization modules:** Each controller has initialization logic under `app/core/Engine/controllers/`. Update these modules if the controller's setup API has changed.
- **Messengers:** Controller messengers are defined under `app/core/Engine/messengers/`. If the controller's event or action types have changed, update the corresponding messenger.
- **Type definitions:** `app/core/Engine/types.ts` aggregates all controller state, action, and event types into unified `EngineState` and `BaseControllerMessenger` types. Update these types to reflect any changes in the upgraded controller's type exports.

### Checklist:

1. Open `app/core/Engine/Engine.ts` and locate the controller being upgraded.
2. Compare the old and new constructor signatures from the package changelog or source.
3. Update the initialization module in `app/core/Engine/controllers/` if needed.
4. Update the messenger in `app/core/Engine/messengers/` if event/action types changed.
5. Update `app/core/Engine/types.ts` to reflect any state shape or type changes.
6. Run `yarn tsc --noEmit` to catch type errors.

---

## 2. State Migrations

**File:** `app/store/migrations/index.ts`

This file contains 76+ Redux-persist migrations that transform persisted user data when the app updates.

### When a `@metamask/*` controller changes its state shape, a new migration MUST be added.

Missing migrations can **corrupt user wallets on upgrade**. This is a critical step.

### Checklist:

1. Read the changelog of the upgraded package to identify any state shape changes.
2. If the state shape changed, create a new migration file in `app/store/migrations/`.
3. Register the new migration in `app/store/migrations/index.ts`.
4. The migration must transform the old persisted state into the new shape.
5. Add unit tests for the migration covering both the happy path and edge cases (e.g., missing keys, null values).
6. Test with a real persisted state snapshot if available.

---

## 3. Patches

**Directory:** `patches/`

This directory contains ~37 patch files applied via `patch-package`. Patched packages include:

- `@metamask/transaction-controller`
- `@metamask/assets-controllers`
- `@metamask/preferences-controller`
- `react-native`
- `react-native-keychain`
- `react-native-svg`
- And others

### When upgrading any patched package, patches will likely fail to apply.

### Checklist:

1. Before upgrading, check if the package has a patch in `patches/`.
2. After upgrading, run `yarn` or `yarn postinstall` — if the patch fails to apply, you will see an error.
3. Evaluate the patch: Was the upstream issue fixed in the new version? If yes, delete the patch file.
4. If the patch is still needed, re-create it against the new version:
   - Make the necessary changes in `node_modules/<package>/`.
   - Run `npx patch-package <package-name>` to regenerate the patch.
5. Verify the patch applies cleanly by running `yarn` again.

---

## 4. Resolutions

**File:** `package.json` (the `resolutions` block, approximately lines 108–152)

The `resolutions` block force-pins ~45 transitive dependencies to specific versions to fix known vulnerabilities. Examples include: `ws`, `elliptic`, `secp256k1`, `axios`, `express`, `nanoid`, `xml2js`.

### Checklist:

1. After upgrading a parent dependency, check whether the new version now satisfies any of the pinned resolutions natively.
2. Run `yarn why <resolution-package>` to see which packages pull in the transitive dependency.
3. If the resolution is no longer needed (the parent dependency now ships a safe version), remove it from `resolutions`.
4. If the resolution is still needed, verify the pinned version is still appropriate — it may need to be bumped as well.
5. Run `yarn install` and verify no resolution conflicts.

---

## 5. Polyfill / Shim Layer

**Files:**
- `shim.js` — Replaces Node.js built-ins with React Native polyfills.
- `package.json` (approximately lines 564–593) — `react-native` and `browser` field mappings replace `crypto`, `stream`, `http`, `fs`, `net`, `os` with RN-compatible polyfills.

### Upgrading packages like `react-native-crypto`, `readable-stream`, `stream-browserify`, `react-native-tcp`, or `buffer` can break these shims.

### Checklist:

1. If upgrading any polyfill package, verify that `shim.js` still correctly initializes the polyfill.
2. Check the `react-native` and `browser` field mappings in `package.json` — ensure they still point to valid modules.
3. Run the app on both iOS and Android to verify that crypto operations, network requests, and stream processing still work.
4. Pay special attention to `Buffer`, `crypto.getRandomValues`, and `stream.Readable` — these are the most commonly broken polyfills.

---

## 6. Native Platform Configs

**iOS:** `ios/Podfile`
- Contains manual pod declarations (ReactNativePayments, OpenSSL-Universal, GzipSwift) and post-install hooks.

**Android:** `android/app/build.gradle`
- Uses Expo's entry resolution and Hermes.

### Upgrading `react-native` or `expo` requires platform config changes.

### Checklist:

1. If upgrading `react-native`:
   - Follow the official React Native upgrade helper: https://react-native-community.github.io/upgrade-helper/
   - Update `ios/Podfile` post-install hooks as needed.
   - Update `android/app/build.gradle` for any Gradle or AGP version changes.
   - Run `cd ios && pod install` to verify iOS builds.
   - Run the Android build to verify Gradle configuration.
2. If upgrading `expo`:
   - Check for breaking changes in Expo's changelog.
   - Update any Expo-related Gradle plugins or Podfile entries.
3. If upgrading any native module (e.g., `react-native-keychain`, `react-native-svg`):
   - Check if the module requires updated pod specs or Gradle dependencies.
   - Run platform builds to verify.

---

## 7. RPC Method Middleware & dApp Connectivity

**Directory:** `app/core/RPCMethods/`
- Ethereum JSON-RPC handlers depending on `@metamask/json-rpc-engine`, `@metamask/rpc-errors`, `@metamask/permission-controller`.

**Modules:**
- `app/core/BackgroundBridge/` — Bridge between dApps and the wallet engine.
- `app/core/SDKConnect/` — MetaMask SDK communication layer depending on `@metamask/sdk-communication-layer`, `@metamask/providers`.
- `app/core/WalletConnect/` — WalletConnect v2 integration depending on `@walletconnect/core`, `@reown/walletkit`.

### Checklist:

1. If upgrading `@metamask/json-rpc-engine` or `@metamask/rpc-errors`:
   - Check all RPC method handlers in `app/core/RPCMethods/` for API changes.
   - Verify error codes and error class constructors still match.
2. If upgrading `@metamask/permission-controller`:
   - Check permission-related RPC methods and the permissions middleware.
3. If upgrading `@walletconnect/core` or `@reown/walletkit`:
   - Update `app/core/WalletConnect/` for any protocol or API changes.
   - Test dApp connections via WalletConnect.
4. If upgrading `@metamask/sdk-communication-layer` or `@metamask/providers`:
   - Update `app/core/SDKConnect/` and `app/core/BackgroundBridge/`.
   - Test SDK-based dApp connections.

---

## 8. Security & Encryption

**Files:**
- `app/core/Encryptor/` — Encryption/decryption logic for vault data.
- `app/core/SecureKeychain.js` — Secure storage via the device keychain.
- `app/core/Vault.js` — Vault management (creation, unlocking, backup).

**Dependencies:** `react-native-quick-crypto`, `react-native-keychain`, `react-native-aes-crypto`.

### Security-critical: upgrading requires careful testing of vault encryption/decryption and biometric auth flows.

### Checklist:

1. If upgrading `react-native-quick-crypto`:
   - Verify that all crypto primitives (PBKDF2, AES-GCM, random bytes) still produce correct output.
   - Test vault creation and unlocking.
2. If upgrading `react-native-keychain`:
   - Verify biometric authentication flows on both iOS and Android.
   - Test secure storage read/write operations.
   - Check the patch in `patches/` — it may need updating.
3. If upgrading `react-native-aes-crypto`:
   - Verify AES encryption/decryption round-trips correctly.
4. **Always** test the full vault lifecycle after upgrading any crypto dependency:
   - Create a new wallet.
   - Lock and unlock with password.
   - Lock and unlock with biometrics (if available).
   - Import a wallet from seed phrase.
   - Export a seed phrase from an existing wallet.

---

## 9. Summary Table

| Dependency Category | Affected Code Areas |
|---|---|
| `@metamask/*` controllers | `Engine.ts`, `Engine/types.ts`, `Engine/controllers/*`, `Engine/messengers/*`, `store/migrations/*` |
| `react-native` / `expo` | `Podfile`, `build.gradle`, `shim.js`, `package.json` polyfill mappings, all native modules |
| Crypto libs | `Encryptor/`, `SecureKeychain.js`, `Vault.js` |
| WalletConnect / SDK | `SDKConnect/`, `WalletConnect/`, `BackgroundBridge/` |
| RPC / middleware libs | `RPCMethods/`, `Permissions/` |
| Any patched package | `patches/` directory |
| Transitive deps | `resolutions` block in `package.json` |

---

## General Upgrade Workflow

1. **Identify the package to upgrade** and read its changelog for breaking changes.
2. **Check this guide** for the relevant section(s) based on the package category.
3. **Check `patches/`** for any existing patches on the package.
4. **Check `resolutions`** for any pinned transitive dependencies related to the package.
5. **Bump the version** in `package.json` and run `yarn install`.
6. **Fix any patch failures** — re-create, update, or remove patches as needed.
7. **Fix type errors** — run `yarn tsc --noEmit` and update Engine types, messengers, and initialization modules.
8. **Add state migrations** if the controller's persisted state shape changed.
9. **Run tests** — `yarn test` for unit tests, and platform builds for native changes.
10. **Test on device/simulator** — especially for crypto, keychain, polyfill, or native module changes.
