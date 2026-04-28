# Bitcoin Native Support — Library Research & Testnet Setup Guide

> **Phase 0 — Team B (Research) Deliverable**
> Date: 2026-04-28

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Bitcoin Integration in MetaMask Mobile](#2-current-bitcoin-integration-in-metamask-mobile)
3. [Library Comparison Matrix](#3-library-comparison-matrix)
4. [Detailed Library Evaluations](#4-detailed-library-evaluations)
5. [Recommended Library Stack](#5-recommended-library-stack)
6. [Testnet & Signet Connection Guide](#6-testnet--signet-connection-guide)
7. [UTXO Management Recommendations](#7-utxo-management-recommendations)
8. [PoC Code Snippets](#8-poc-code-snippets)
9. [Known Risks & Limitations](#9-known-risks--limitations)
10. [Appendix: API Endpoint Reference](#10-appendix-api-endpoint-reference)

---

## 1. Executive Summary

This document evaluates JavaScript/TypeScript libraries suitable for adding native Bitcoin support to MetaMask Mobile (React Native). The primary recommendation is the **`@scure/*` + `@noble/*` stack** (by Paul Miller), which is already partially integrated into MetaMask's dependency tree, is security-audited, pure JS, React Native compatible, and covers the full Bitcoin feature set from key derivation through transaction signing and UTXO selection.

### Key Recommendation

| Layer | Library | Justification |
|-------|---------|---------------|
| Crypto primitives | `@noble/hashes` + `@noble/curves` | Already in MM dependency tree; audited 3x; pure JS; 0 deps |
| Key derivation | `@scure/bip32` + `@scure/bip39` | `@metamask/scure-bip39` already a direct dependency; audited |
| Transaction signing | `@scure/btc-signer` | Audited by Cure53; 39KB gzipped; built-in UTXO selection |
| Blockchain API | Mempool.space REST API | Already used for block explorer URLs in MM; free; testnet+signet support |
| Fallback API | Blockstream Esplora API | Alternative UTXO/tx provider; well-documented REST API |

---

## 2. Current Bitcoin Integration in MetaMask Mobile

MetaMask Mobile already has partial Bitcoin support through the Snap-based architecture:

### Existing Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| `@metamask/bitcoin-wallet-snap` | `^0.9.0` | Pre-installed Snap for BTC wallet functionality |
| `@metamask/scure-bip39` | `^2.1.0` | MetaMask's fork of `@scure/bip39` for mnemonic generation |
| `@noble/hashes` | `^1.7.1` | Cryptographic hashing (direct dependency) |
| `bitcoin-address-validation` | `2.2.3` | Address format validation (mainnet/testnet) |

### Existing Code Paths

- **`app/core/SnapKeyring/BitcoinWalletSnap.ts`** — Bitcoin wallet Snap integration (behind `///: BEGIN:ONLY_INCLUDE_IF(bitcoin)` flag)
- **`app/core/SnapKeyring/MultichainWalletSnapClient.ts`** — Abstract multichain account management (BTC + SOL)
- **`app/core/Multichain/constants.ts`** — BTC network scopes (`BtcScope.Mainnet`, `BtcScope.Testnet`), block explorer URLs (already points to `mempool.space`)
- **`app/core/Multichain/utils.ts`** — Address validation using `bitcoin-address-validation`, account type checking (`BtcAccountType.P2wpkh`)

### Transitive Dependencies Already Present (via `yarn.lock`)

- `@noble/hashes` (~1.3.2+ multiple versions)
- `@noble/curves` (^1.8.1)
- `@scure/base` (~1.1.3)
- `secp256k1` (3.8.1 and 4.0.4 — native bindings, used by Ethereum libs)

---

## 3. Library Comparison Matrix

| Library | RN Compatible | Pure JS | Bundle Size (gzip) | TS Native | Audited | Maintenance | Key Features |
|---------|:---:|:---:|---:|:---:|:---:|:---:|---|
| **`@scure/btc-signer`** | Yes | Yes | 39KB | Yes | Cure53 (v0.3.0, Feb 2023) | Active (v2.2.0) | Full tx building, PSBT, Taproot, UTXO selection, MuSig2 |
| **`bitcoinjs-lib`** | Partial | Partial | ~80-120KB | Yes | Community-reviewed | Active (v7.0.1) | Full tx building, PSBT, Taproot, extensible |
| **`@noble/curves`** | Yes | Yes | 26KB (single curve, 11KB gzip) | Yes | 3x audited (Cure53, Kudelski, Trail of Bits) | Active (v2.x) | secp256k1, ECDSA, Schnorr/BIP340, ECDH |
| **`@noble/hashes`** | Yes | Yes | 2.4KB (SHA256 only) / 21KB (full) | Yes | Cure53 (v1.0.0, Jan 2022) | Active (v2.2.0) | SHA2, SHA3, RIPEMD160, HMAC, HKDF, PBKDF2, Scrypt |
| **`@scure/bip32`** | Yes | Yes | 18KB | Yes | Cure53 (v1.0.1, Jan 2022) | Active (v2.2.0) | HD wallet key derivation (BIP32) |
| **`@scure/bip39`** | Yes | Yes | 14KB (+wordlist) | Yes | Cure53 (v1.0.0, Jan 2022) | Active (v2.2.0) | Mnemonic generation/validation (BIP39) |
| **`bitcoin-address-validation`** | Yes | Yes | ~5KB | Partial | No | Moderate | Address format validation only |
| **`bip174` (npm)** | Yes | Yes | ~15KB | Yes | No formal audit | Low maintenance | PSBT encoding/decoding (used by bitcoinjs-lib) |
| **Mempool.space API** | Yes (REST) | N/A | 0 (API) | N/A | N/A | Active | UTXO, tx broadcast, fee estimation, blocks |
| **Blockstream Esplora API** | Yes (REST) | N/A | 0 (API) | N/A | N/A | Active | UTXO, tx broadcast, fee estimation |

---

## 4. Detailed Library Evaluations

### 4.1 `@scure/btc-signer` — **RECOMMENDED for transaction building**

**Repository**: https://github.com/paulmillr/scure-btc-signer
**Version**: 2.2.0 (latest)
**License**: MIT

#### React Native Compatibility
- **Pure JavaScript** — no native modules, no WASM, no Node.js-specific APIs
- Only requires a polyfill for `crypto.getRandomValues` (e.g., `react-native-get-random-values`, which MetaMask Mobile likely already provides)
- Uses `Uint8Array` throughout (no `Buffer` dependency)

#### Bundle Size Impact
- **39KB gzipped** with all dependencies included
- Tree-shakeable: import only what you need
- Dependencies are minimal: `@noble/curves`, `@noble/hashes`, `@scure/base`, `micro-packed`

#### TypeScript Support
- Written entirely in TypeScript
- Comprehensive type definitions included
- Strict types for transaction inputs, outputs, PSBT structures

#### Maintenance & Community
- Actively maintained by Paul Miller (same author as `@noble/*` ecosystem)
- Regular releases with semver
- PGP-signed releases and transparent NPM builds

#### Security Audit Status
- **Audited by Cure53** at version 0.3.0 (February 2023)
- MuSig2 and UTXO selection features **not yet audited** (added post-audit)
- Supply chain security: PGP-signed commits, locked dependencies, transparent CI

#### Feature Coverage
- **Address generation**: P2PKH, P2SH, P2WPKH, P2WSH, P2TR (Taproot), P2TR-NS, P2TR-MS, P2TR-PK, P2A (Anchor)
- **Transaction building**: Full input/output management, signing, serialization
- **PSBT support**: BIP174 (PSBTv0) and draft PSBTv2
- **Taproot**: Full BIP340/BIP341 support (Schnorr signatures, script trees, key/script spend)
- **UTXO selection**: Built-in coin selection with multiple strategies (see Section 7)
- **MuSig2**: BIP327 multi-signature support
- **Ordinals/Inscriptions**: Supported
- **No network code**: Offline-capable, simplified auditing

#### Integration Complexity
- **Low**: Shares the same `@noble/*` crypto foundation already in MetaMask's dependency tree
- Drop-in usage — create transaction, add inputs/outputs, sign, serialize
- No ECC library injection needed (unlike `bitcoinjs-lib`)

---

### 4.2 `bitcoinjs-lib`

**Repository**: https://github.com/bitcoinjs/bitcoinjs-lib
**Version**: 7.0.1 (latest)
**License**: MIT

#### React Native Compatibility
- **Partial**: Has migrated from `Buffer` to `Uint8Array` in v7, improving compatibility
- However, requires injection of an ECC library (peer dependency):
  - `tiny-secp256k1` — uses **WASM**, which has compatibility issues on iOS
  - `@bitcoin-js/tiny-secp256k1-asmjs` — ASM.js fallback (slower, but pure JS)
  - `@bitcoinerlab/secp256k1` — another alternative
- Additional peer dependencies: `ecpair` (key pairs), `bip32` (HD keys)
- iOS-specific warnings about `Buffer` implementations (must use `buffer@5.0.5+`)

#### Bundle Size Impact
- **~80-120KB** depending on which optional dependencies are included
- Core library is modular (ECPair, bip32 separated out), but practical usage requires multiple packages
- Heavier dependency tree than `@scure/btc-signer`

#### TypeScript Support
- Written in TypeScript since v6
- Good type definitions
- `bigint` for satoshi values (prevents floating-point errors)

#### Maintenance & Community
- Most popular Bitcoin JS library (~1.8K GitHub stars)
- Large community and ecosystem
- Active development, regular releases
- Extensive examples and documentation

#### Security Audit Status
- **No formal independent audit** of the library itself
- Emphasizes community verification ("Don't trust. Verify.")
- >95% test coverage
- Well-established track record (since 2014)

#### Feature Coverage
- **Address generation**: P2PKH, P2SH, P2WPKH, P2WSH, P2TR
- **Transaction building**: Full PSBT workflow (BIP174/BIP371)
- **Taproot**: Full support (SegWit v1, Schnorr, Bech32m)
- **Scripting**: Low-level script compilation/decompilation
- **No built-in UTXO selection** (must implement separately)
- **No network code**

#### Integration Complexity
- **Medium-High**:
  - Requires ECC library injection (`initEccLib`)
  - Multiple peer dependencies must be coordinated
  - WASM compatibility issues on React Native require workarounds
  - No built-in coin selection — must use separate library or implement custom

---

### 4.3 `@noble/curves` (includes `secp256k1`)

**Repository**: https://github.com/paulmillr/noble-curves
**Version**: 2.x (latest)
**License**: MIT

#### React Native Compatibility
- **Fully compatible** — pure JavaScript, no native bindings, no WASM
- May need `getRandomValues` polyfill

#### Bundle Size Impact
- **26KB** for single curve build (11KB gzipped)
- 93KB for everything including hashes
- Tree-shakeable: `import { secp256k1 } from '@noble/curves/secp256k1'`

#### Security Audit Status
- **Audited 3 times**:
  1. Cure53 (v1.6.0, September 2024)
  2. Kudelski Security (v1.2.0, September 2023)
  3. Trail of Bits (v0.7.3, February 2023)
- Tested with Wycheproof vectors, property-based tests, continuous fuzzing

#### Key Features
- secp256k1 with ECDSA and Schnorr (BIP340)
- Endomorphism optimization (2x less RAM, 20% faster ECDH)
- Targets algorithmic constant-time execution

#### Integration Complexity
- **Very low**: Already a transitive dependency in MetaMask Mobile (`@noble/curves@^1.8.1` in yarn.lock)
- Used internally by `@scure/btc-signer`

---

### 4.4 `@noble/hashes`

**Repository**: https://github.com/paulmillr/noble-hashes
**Version**: 2.2.0 (latest)
**License**: MIT

#### React Native Compatibility
- **Fully compatible** — pure JavaScript, zero runtime dependencies

#### Bundle Size Impact
- **2.4KB gzipped** for SHA-256 alone
- **21KB gzipped** for the full library
- Optimal tree-shaking (file-level granularity, no barrel exports)

#### Security Audit Status
- **Audited by Cure53** (v1.0.0, January 2022), funded by Ethereum Foundation
- Covers: SHA2, SHA3, RIPEMD160, HMAC, HKDF, PBKDF2, Scrypt
- Not covered in audit: blake3, sha3-addons, sha1, argon2

#### Integration Complexity
- **Already a direct dependency** in MetaMask Mobile (`@noble/hashes@^1.7.1`)
- Zero additional effort needed

---

### 4.5 `@scure/bip32` — HD Key Derivation

**Repository**: https://github.com/paulmillr/scure-bip32
**Version**: 2.2.0 (latest)
**License**: MIT

#### React Native Compatibility
- **Fully compatible** — pure JavaScript

#### Bundle Size Impact
- **18KB gzipped** with all dependencies

#### Security Audit Status
- **Audited by Cure53** (v1.0.1, January 2022), funded by Ethereum Foundation

#### Key Features
- BIP32 hierarchical deterministic key derivation
- Hardened and non-hardened derivation
- Extended key serialization (xprv/xpub)
- Single `HDKey` class with clean API

#### Dependencies
- `@noble/curves`, `@noble/hashes`, `@scure/base` (all audited, same author)

#### Integration Complexity
- **Low**: Already a transitive dependency via `@metamask/scure-bip39`
- Compatible with Bitcoin derivation path `m/84'/0'/0'` (BIP84 for native SegWit)

---

### 4.6 `@scure/bip39` / `@metamask/scure-bip39` — Mnemonic Phrases

**Repository**: https://github.com/paulmillr/scure-bip39
**Version**: 2.2.0 (latest); MetaMask fork: 2.1.1
**License**: MIT

#### React Native Compatibility
- **Fully compatible** — pure JavaScript

#### Bundle Size Impact
- **14KB gzipped** with one wordlist; 79KB with all wordlists

#### Security Audit Status
- **Audited by Cure53** (v1.0.0, January 2022)

#### Key Features
- Mnemonic generation (12-24 words)
- Entropy ↔ mnemonic conversion
- Mnemonic validation
- Seed derivation (sync + async + WebCrypto variants)
- 10 language wordlists

#### Integration Complexity
- **Already a direct dependency** (`@metamask/scure-bip39@^2.1.0`)
- MetaMask maintains a fork to ensure supply chain control
- Zero additional effort needed

---

### 4.7 Blockchain API Clients

#### Mempool.space REST API — **RECOMMENDED**

**Base URLs**:
- Mainnet: `https://mempool.space/api`
- Testnet3: `https://mempool.space/testnet/api`
- Testnet4: `https://mempool.space/testnet4/api`
- Signet: `https://mempool.space/signet/api`

**Key Endpoints**:
| Endpoint | Purpose |
|----------|---------|
| `GET /address/{addr}` | Address info (funded txo count, balance) |
| `GET /address/{addr}/utxo` | List UTXOs for address |
| `GET /address/{addr}/txs` | Transaction history |
| `POST /tx` | Broadcast raw transaction |
| `GET /v1/fees/recommended` | Fee estimation (fastest, halfHour, hour, economy) |
| `GET /block-height/{height}` | Block hash at height |
| `GET /tx/{txid}` | Transaction details |
| `GET /tx/{txid}/status` | Transaction confirmation status |

**Advantages**:
- Already referenced in MetaMask Mobile (`mempool.space` used for block explorer URLs)
- Free tier with generous rate limits
- Open source (can self-host)
- Supports all test networks
- Rich fee estimation (multiple time targets)
- WebSocket support for real-time updates

**Rate Limits**: Public API allows ~10 requests/second. For higher throughput, self-hosting is recommended.

**No official npm client** — the `mempool.js` package on npm is an unrelated memory pooling library. Use `fetch` directly with the REST API.

#### Blockstream Esplora API — **RECOMMENDED as fallback**

**Base URLs**:
- Mainnet: `https://blockstream.info/api`
- Testnet3: `https://blockstream.info/testnet/api`

**Key Endpoints**: Same as Mempool.space (Esplora-compatible). Mempool.space API is actually Esplora-compatible.

**Advantages**:
- Well-established and reliable
- Open source (Esplora)
- Good documentation

**Limitations**:
- No signet or testnet4 support on public instance
- Less granular fee estimation than Mempool.space
- No official JS client library

---

## 5. Recommended Library Stack

### Primary Stack (Recommended)

```
@scure/btc-signer (v2.2.0)
├── @noble/curves (secp256k1, Schnorr/BIP340)
├── @noble/hashes (SHA-256, RIPEMD-160, HMAC)
├── @scure/base (base58, bech32)
└── micro-packed (binary serialization)

@scure/bip32 (v2.2.0)     — HD key derivation (BIP32)
@scure/bip39 (v2.2.0)     — Mnemonic handling (via @metamask/scure-bip39)

Blockchain APIs:
├── Mempool.space REST API — Primary (UTXO, fees, broadcast)
└── Blockstream Esplora   — Fallback
```

### Justification

1. **Already in the dependency tree**: `@noble/hashes`, `@noble/curves`, `@metamask/scure-bip39` are already direct or transitive dependencies. Adding `@scure/btc-signer` and `@scure/bip32` extends the same trusted ecosystem.

2. **Security-audited**: Every library in the stack has been audited by Cure53, Kudelski Security, or Trail of Bits. `bitcoinjs-lib` has no formal audit.

3. **Pure JavaScript**: The entire stack runs in pure JS with no native modules, WASM, or Node.js-specific APIs. This eliminates the React Native compatibility issues that plague `bitcoinjs-lib` (WASM ECC on iOS).

4. **Minimal bundle impact**: `@scure/btc-signer` is 39KB gzipped total. Adding it alongside already-present `@noble/*` deps has near-zero marginal cost. `bitcoinjs-lib` would add ~80-120KB plus multiple peer dependencies.

5. **Built-in UTXO selection**: `@scure/btc-signer` includes battle-tested coin selection algorithms. `bitcoinjs-lib` requires a separate implementation.

6. **Same author, consistent API**: The entire `@noble/*` / `@scure/*` ecosystem is maintained by Paul Miller with consistent API patterns, TypeScript types, and security practices.

7. **MetaMask ecosystem alignment**: The MetaMask `bitcoin-wallet-snap` and other MetaMask packages already use `@noble/*` primitives. Native Bitcoin support should extend this pattern.

### Why Not `bitcoinjs-lib`?

| Concern | `bitcoinjs-lib` | `@scure/btc-signer` |
|---------|-----------------|---------------------|
| RN compatibility | Requires WASM ECC workarounds | Pure JS, works out of the box |
| Formal audit | None | Cure53 |
| Bundle size | ~80-120KB + peer deps | 39KB all-inclusive |
| UTXO selection | Not included | Built-in |
| Dependency count | 7+ direct deps + peer deps | 4 deps (all `@noble/@scure`) |
| Already in MM | No | Shares foundation with existing deps |

`bitcoinjs-lib` is the most popular library and has excellent documentation and community support. It would be a reasonable choice for a Node.js backend, but for a React Native mobile wallet, `@scure/btc-signer` is clearly superior on every metric that matters.

---

## 6. Testnet & Signet Connection Guide

### 6.1 Network Overview

| Network | Purpose | Block Time | Coin Value | Reliability |
|---------|---------|-----------|------------|-------------|
| **Testnet3** | Legacy test network | ~10 min (variable) | None | Moderate (occasional storms) |
| **Testnet4** | Newer test network (BIP94) | ~10 min | None | Good (new, less abuse) |
| **Signet** | Controlled test network | ~10 min (consistent) | None | High (centralized block signing) |
| **Regtest** | Local development | On-demand | None | Perfect (local) |

**Recommendation**: Use **Signet** as primary test network. It has:
- Consistent block times (no mining difficulty storms)
- Reliable faucets
- Full feature parity with mainnet (including Taproot)
- Good API support from Mempool.space

Use **Testnet4** as secondary. Avoid Testnet3 for new development (being deprecated).

### 6.2 Public API Endpoints

#### Mempool.space (Recommended)

| Network | Base URL | Status |
|---------|----------|--------|
| Mainnet | `https://mempool.space/api` | Verified active |
| Testnet3 | `https://mempool.space/testnet/api` | Verified active (block height: 4,952,549) |
| Testnet4 | `https://mempool.space/testnet4/api` | Verified active (block height: 132,868) |
| Signet | `https://mempool.space/signet/api` | Verified active (block height: 302,105) |

#### Blockstream Esplora

| Network | Base URL | Status |
|---------|----------|--------|
| Mainnet | `https://blockstream.info/api` | Verified active |
| Testnet3 | `https://blockstream.info/testnet/api` | Verified active |

#### Other Options

| Provider | URL | Notes |
|----------|-----|-------|
| Mempool.space WebSocket | `wss://mempool.space/api/v1/ws` | Real-time block/tx notifications |
| BTC RPC Explorer | Self-hosted | Open source, connects to your own node |

### 6.3 Faucet Availability

| Network | Faucet | Notes |
|---------|--------|-------|
| Signet | `https://signet.bc-2.jp/` | Reliable, dispenses ~0.01 BTC |
| Signet | `https://alt.signetfaucet.com/` | Alternative faucet |
| Testnet4 | `https://mempool.space/testnet4/faucet` | Mempool.space integrated faucet |
| Testnet3 | `https://bitcoinfaucet.uo1.net/` | Often depleted; less reliable |
| Testnet3 | `https://coinfaucet.eu/en/btc-testnet/` | Alternative testnet3 faucet |

### 6.4 Electrum Server Options

Electrum protocol (ElectrumX/Fulcrum) provides efficient UTXO lookups via subscription-based protocol:

| Option | Pros | Cons |
|--------|------|------|
| **Public Electrum servers** | No setup; free | Unreliable; privacy concerns |
| **Fulcrum (self-hosted)** | Fast; full UTXO index | Requires full node + disk space |
| **ElectrumX (self-hosted)** | Battle-tested | Python; slower than Fulcrum |
| **Esplora API** | REST-based; simpler | No subscription model |

**Recommendation for mobile wallet**: Use **REST APIs** (Mempool.space/Blockstream) rather than Electrum protocol. REST is simpler, works through standard HTTP (no special protocol), and avoids the complexity of maintaining WebSocket connections on mobile. For production, consider self-hosting Mempool.space or Esplora for reliability and privacy.

### 6.5 Full Node vs SPV vs API-Based Approaches

| Approach | Privacy | Trust Model | Bandwidth | Battery | Complexity |
|----------|---------|-------------|-----------|---------|------------|
| **Full node** | Excellent | Trustless | Very high | Very high | Very high |
| **SPV (BIP37)** | Poor (bloom filter leaks) | Semi-trusted | Low | Medium | High |
| **Neutrino (BIP157/158)** | Good | Semi-trusted | Low | Low | Medium |
| **API-based** | Low (server sees queries) | Trusted server | Very low | Very low | Low |
| **Hybrid API + validation** | Medium | Semi-trusted | Low | Low | Medium |

**Recommendation for MetaMask Mobile**: **API-based with multi-provider redundancy**. This is the standard approach for mobile wallets:

1. Use Mempool.space API as primary provider
2. Use Blockstream Esplora as fallback
3. Validate transaction inclusion with merkle proofs when possible
4. Consider adding Neutrino (BIP157/158) support in a future phase for improved privacy

This matches how the existing MetaMask `bitcoin-wallet-snap` and similar mobile wallets (BlueWallet, Exodus) operate.

---

## 7. UTXO Management Recommendations

### 7.1 Coin Selection Algorithms

`@scure/btc-signer` provides built-in UTXO selection via `selectUTXO()`. Available strategies:

| Strategy | Description | Best For |
|----------|-------------|----------|
| `'default'` | Privacy-focused: `exactBiggest/accumBiggest` | General use |
| `'all'` | Uses all UTXOs | Consolidation transactions |
| `'exactBiggest'` | Find exact match starting from largest UTXOs | Minimizing change |
| `'exactSmallest'` | Find exact match starting from smallest UTXOs | Dust cleanup |
| `'accumBiggest'` | Accumulate from largest to smallest | Fewer inputs, lower fees |
| `'accumSmallest'` | Accumulate from smallest to largest | UTXO cleanup |
| `'exactBiggest/accumSmallest'` | Try exact match first, then accumulate | **Recommended**: optimal fees |

#### How Other Mobile Wallets Handle Coin Selection

| Wallet | Algorithm | Notes |
|--------|-----------|-------|
| **BlueWallet** | Branch-and-bound + fallback | Based on Bitcoin Core's algorithm |
| **Exodus** | Largest-first accumulation | Simpler, less optimal |
| **Electrum** | Privacy-focused random | Prioritizes privacy over fee optimization |
| **Bitcoin Core** | Branch-and-bound (BnB) | Gold standard; finds exact matches |

**Recommendation**: Use `@scure/btc-signer`'s `'exactBiggest/accumSmallest'` as default strategy. This:
- Tries to find an exact-match UTXO first (minimizing change outputs)
- Falls back to accumulating from smallest UTXOs (cleaning up dust)
- Balances fee optimization with UTXO hygiene

### 7.2 Fee Estimation

#### Approach

Use Mempool.space's recommended fees API:

```
GET https://mempool.space/api/v1/fees/recommended

Response:
{
  "fastestFee": 4,      // sat/vB — next block
  "halfHourFee": 3,     // sat/vB — ~3 blocks
  "hourFee": 3,         // sat/vB — ~6 blocks
  "economyFee": 2,      // sat/vB — ~12+ blocks
  "minimumFee": 1       // sat/vB — minimum relay fee
}
```

#### Fee Estimation Strategy

1. **Present 3 tiers to user**: Fast (next block), Normal (~30 min), Economy (~1 hr)
2. **Allow custom fee rate** for advanced users
3. **Cache fee rates** with 30-60 second TTL to reduce API calls
4. **Fallback**: If Mempool.space is unavailable, use Blockstream's `/fee-estimates` endpoint
5. **Minimum relay fee**: Never go below 1 sat/vB

### 7.3 Replace-by-Fee (RBF) Support

RBF (BIP125) allows unconfirmed transactions to be replaced with higher-fee versions.

#### Implementation Considerations

1. **Signal RBF by default**: Set `sequence` to `0xfffffffd` (less than `0xffffffff - 1`) on all inputs. This is now standard practice.
2. **Track unconfirmed transactions**: Maintain a local mempool of pending transactions that can be bumped.
3. **Fee bumping UI**: Allow users to increase the fee on stuck transactions.
4. **Implementation with `@scure/btc-signer`**:
   - Reconstruct the transaction with the same inputs
   - Increase the fee rate
   - Re-sign and broadcast

```typescript
// RBF signaling: set sequence < 0xfffffffe
const tx = new btc.Transaction();
tx.addInput({
  txid: prevTxId,
  index: 0,
  sequence: 0xfffffffd, // Signals RBF
  // ... other input data
});
```

### 7.4 Address Gap Limit & Discovery

#### BIP44 Gap Limit

The standard gap limit is **20 consecutive unused addresses**. When scanning for funds:

1. Derive addresses sequentially on the derivation path
2. Check each address for transaction history via API
3. Stop scanning when 20 consecutive addresses have no history
4. Track separate chains: external (receiving, index 0) and internal (change, index 1)

#### Derivation Paths for Bitcoin

| BIP | Path | Address Type | Prefix |
|-----|------|-------------|--------|
| BIP44 | `m/44'/0'/0'/0/i` | P2PKH (Legacy) | `1...` |
| BIP49 | `m/49'/0'/0'/0/i` | P2SH-P2WPKH (Nested SegWit) | `3...` |
| BIP84 | `m/84'/0'/0'/0/i` | P2WPKH (Native SegWit) | `bc1q...` |
| BIP86 | `m/86'/0'/0'/0/i` | P2TR (Taproot) | `bc1p...` |

**Recommendation**: Support **BIP84** (native SegWit / P2WPKH) as default — this is what the existing `BtcAccountType.P2wpkh` in MetaMask Mobile uses. Add BIP86 (Taproot) support in a future iteration.

For testnet, replace coin type `0'` with `1'`:
- Testnet BIP84: `m/84'/1'/0'/0/i`

#### Discovery Strategy

```
1. For each account (0, 1, 2, ...):
   a. Scan external chain (m/84'/0'/account'/0/0..19)
   b. Scan internal chain (m/84'/0'/account'/1/0..19)
   c. If any addresses have history, extend gap limit window
   d. If 20 consecutive addresses are empty, stop for this account
2. If account has no transactions at all, stop account discovery
```

---

## 8. PoC Code Snippets

### 8.1 Generate Bitcoin Address from Mnemonic

```typescript
import { HDKey } from '@scure/bip32';
import { mnemonicToSeedSync } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english';
import * as btc from '@scure/btc-signer';

// Derive a native SegWit (BIP84) address from mnemonic
function deriveP2WPKHAddress(mnemonic: string, accountIndex = 0, addressIndex = 0): string {
  const seed = mnemonicToSeedSync(mnemonic);
  const root = HDKey.fromMasterSeed(seed);
  const child = root.derive(`m/84'/0'/${accountIndex}'/0/${addressIndex}`);

  if (!child.publicKey) throw new Error('Failed to derive public key');

  const payment = btc.p2wpkh(child.publicKey);
  if (!payment.address) throw new Error('Failed to generate address');

  return payment.address; // bc1q...
}
```

### 8.2 Build and Sign a Transaction

```typescript
import * as btc from '@scure/btc-signer';
import { hex } from '@scure/base';

function buildTransaction(
  privateKey: Uint8Array,
  publicKey: Uint8Array,
  utxos: Array<{ txid: string; index: number; value: bigint; script: Uint8Array }>,
  recipientAddress: string,
  amountSats: bigint,
  feeRateSatPerVB: bigint,
): Uint8Array {
  const tx = new btc.Transaction();

  // Add inputs (with RBF signaling)
  for (const utxo of utxos) {
    tx.addInput({
      txid: utxo.txid,
      index: utxo.index,
      witnessUtxo: {
        amount: utxo.value,
        script: utxo.script,
      },
      sequence: 0xfffffffd, // RBF enabled
    });
  }

  // Add recipient output
  tx.addOutputAddress(recipientAddress, amountSats);

  // Sign all inputs
  tx.sign(privateKey);
  tx.finalize();

  return tx.extract(); // Raw transaction bytes
}
```

### 8.3 UTXO Selection with `selectUTXO`

```typescript
import * as btc from '@scure/btc-signer';

interface UTXO {
  txid: string;
  index: number;
  value: bigint;
  script: Uint8Array;
}

function createOptimalTransaction(
  utxos: UTXO[],
  recipientAddress: string,
  amountSats: bigint,
  changeAddress: string,
  feeRate: bigint,
  publicKey: Uint8Array,
  privateKey: Uint8Array,
): Uint8Array | null {
  const inputs = utxos.map((u) => ({
    txid: u.txid,
    index: u.index,
    witnessUtxo: { amount: u.value, script: u.script },
    sequence: 0xfffffffd,
  }));

  const result = btc.selectUTXO(inputs, [
    { address: recipientAddress, amount: amountSats },
  ], {
    changeAddress,
    feePerByte: feeRate,
    bip69: true, // Lexicographic ordering for privacy
    createTx: true,
    network: btc.NETWORK, // Use btc.TEST_NETWORK for testnet
  });

  if (!result || !result.tx) return null;

  result.tx.sign(privateKey);
  result.tx.finalize();
  return result.tx.extract();
}
```

### 8.4 Fetch UTXOs and Fee Estimates

```typescript
// Thin API client for Mempool.space / Blockstream Esplora
const MEMPOOL_BASE = 'https://mempool.space/api';
const BLOCKSTREAM_BASE = 'https://blockstream.info/api';

interface MempoolUTXO {
  txid: string;
  vout: number;
  status: { confirmed: boolean; block_height?: number };
  value: number;
}

interface FeeRecommendation {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

async function fetchUTXOs(address: string, baseUrl = MEMPOOL_BASE): Promise<MempoolUTXO[]> {
  const response = await fetch(`${baseUrl}/address/${address}/utxo`);
  if (!response.ok) throw new Error(`Failed to fetch UTXOs: ${response.status}`);
  return response.json();
}

async function fetchFeeEstimates(baseUrl = MEMPOOL_BASE): Promise<FeeRecommendation> {
  const response = await fetch(`${baseUrl}/v1/fees/recommended`);
  if (!response.ok) throw new Error(`Failed to fetch fees: ${response.status}`);
  return response.json();
}

async function broadcastTransaction(rawTxHex: string, baseUrl = MEMPOOL_BASE): Promise<string> {
  const response = await fetch(`${baseUrl}/tx`, {
    method: 'POST',
    body: rawTxHex,
    headers: { 'Content-Type': 'text/plain' },
  });
  if (!response.ok) throw new Error(`Broadcast failed: ${response.status}`);
  return response.text(); // Returns txid
}
```

### 8.5 Address Discovery (Gap Limit)

```typescript
import { HDKey } from '@scure/bip32';
import * as btc from '@scure/btc-signer';

const GAP_LIMIT = 20;

interface DiscoveredAddress {
  path: string;
  address: string;
  index: number;
  hasHistory: boolean;
}

async function discoverAddresses(
  root: HDKey,
  accountIndex: number,
  chain: 0 | 1, // 0 = external (receiving), 1 = internal (change)
  fetchHasHistory: (address: string) => Promise<boolean>,
): Promise<DiscoveredAddress[]> {
  const discovered: DiscoveredAddress[] = [];
  let consecutiveEmpty = 0;
  let index = 0;

  while (consecutiveEmpty < GAP_LIMIT) {
    const path = `m/84'/0'/${accountIndex}'/${chain}/${index}`;
    const child = root.derive(path);
    if (!child.publicKey) throw new Error(`Failed to derive key at ${path}`);

    const payment = btc.p2wpkh(child.publicKey);
    const address = payment.address!;
    const hasHistory = await fetchHasHistory(address);

    discovered.push({ path, address, index, hasHistory });

    if (hasHistory) {
      consecutiveEmpty = 0;
    } else {
      consecutiveEmpty++;
    }
    index++;
  }

  return discovered;
}
```

---

## 9. Known Risks & Limitations

### 9.1 Library-Level Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| `@scure/btc-signer` UTXO selection not audited | Medium — coin selection bugs could lose funds | Extensive testing; consider funding an audit of v2.x |
| `@scure/btc-signer` MuSig2 not audited | Low — not needed for initial implementation | Defer MuSig2 usage until audited |
| Single maintainer (Paul Miller) | Bus factor risk | MetaMask can fork/maintain; code is well-documented |
| `crypto.getRandomValues` polyfill needed | Low — standard RN requirement | Use `react-native-get-random-values` (likely already present) |

### 9.2 Architecture Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| API provider reliability | UTXOs/fees unavailable | Multi-provider fallback (Mempool + Blockstream) |
| API privacy | Server sees all address queries | Use multiple providers; consider self-hosted Mempool |
| Fee estimation accuracy | Overpay or stuck transactions | Multiple fee tiers; RBF support for re-bumping |
| Testnet coin availability | Blocked testing | Use Signet (reliable faucets); cache test coins |

### 9.3 Integration Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Version conflicts with existing `@noble/*` deps | Build failures | Carefully align versions; use yarn resolutions |
| Snap vs native architecture decision | Duplicated code paths | Decide early: extend Snap or build native |
| BIP32 key derivation from existing SRP | Security-critical | Reuse MetaMask's existing SRP infrastructure |
| React Native Metro bundler compatibility | Build issues | Test early; `@scure/*` uses ESM but provides CJS |

### 9.4 Bitcoin-Specific Limitations

| Limitation | Description |
|------------|-------------|
| No Lightning Network | This research covers on-chain only; Lightning requires separate infrastructure |
| No hardware wallet signing | Needs separate integration with Ledger/Trezor for Bitcoin-specific signing |
| No coin control UI | Advanced users may want manual UTXO selection — defer to later phase |
| No batched payments | Sending to multiple recipients in one tx — defer to later phase |

---

## 10. Appendix: API Endpoint Reference

### Mempool.space API — Complete Reference

```
# Address
GET /api/address/{address}                    # Address info
GET /api/address/{address}/txs                # Transaction history
GET /api/address/{address}/txs/chain/{txid}   # Paginated tx history
GET /api/address/{address}/txs/mempool        # Unconfirmed transactions
GET /api/address/{address}/utxo               # Unspent outputs

# Transaction
GET /api/tx/{txid}                            # Transaction details
GET /api/tx/{txid}/hex                        # Raw transaction hex
GET /api/tx/{txid}/status                     # Confirmation status
GET /api/tx/{txid}/merkle-proof               # Merkle proof
POST /api/tx                                  # Broadcast transaction (body: hex)

# Fee Estimation
GET /api/v1/fees/recommended                  # Recommended fees (fast/medium/slow)
GET /api/v1/fees/mempool-blocks               # Projected mempool blocks

# Block
GET /api/block/{hash}                         # Block details
GET /api/block-height/{height}                # Block hash at height
GET /api/blocks/tip/height                    # Current chain tip height

# Mempool
GET /api/mempool                              # Mempool statistics
GET /api/mempool/txids                        # All mempool transaction IDs
GET /api/mempool/recent                       # Recent mempool transactions
```

### Network Configuration Constants

```typescript
// For use with @scure/btc-signer
import * as btc from '@scure/btc-signer';

const NETWORKS = {
  mainnet: btc.NETWORK,       // { bech32: 'bc', pubKeyHash: 0x00, scriptHash: 0x05 }
  testnet: btc.TEST_NETWORK,  // { bech32: 'tb', pubKeyHash: 0x6f, scriptHash: 0xc4 }
} as const;

const API_ENDPOINTS = {
  mainnet: {
    mempool: 'https://mempool.space/api',
    blockstream: 'https://blockstream.info/api',
  },
  testnet3: {
    mempool: 'https://mempool.space/testnet/api',
    blockstream: 'https://blockstream.info/testnet/api',
  },
  testnet4: {
    mempool: 'https://mempool.space/testnet4/api',
  },
  signet: {
    mempool: 'https://mempool.space/signet/api',
  },
} as const;

// BIP84 derivation paths
const DERIVATION_PATHS = {
  mainnet: "m/84'/0'/0'",
  testnet: "m/84'/1'/0'",
} as const;
```
