# Bitcoin Development Setup Guide

This guide covers everything needed to start developing Bitcoin native support features in MetaMask Mobile.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Environment Configuration](#environment-configuration)
- [API Endpoint Configuration](#api-endpoint-configuration)
- [Testnet Wallet Setup](#testnet-wallet-setup)
- [Development Scripts](#development-scripts)
- [Architecture Overview](#architecture-overview)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### System Requirements

- **Node.js** >= 20 (managed via nvm)
- **Yarn** (classic, v1.x — managed via corepack)
- **curl** (for API scripts)
- **jq** (optional, for JSON processing in scripts)

### Existing MetaMask Mobile Setup

Bitcoin development builds on the existing MetaMask Mobile dev environment. Complete the standard setup first:

```bash
# Clone and install (if not already done)
git clone https://github.com/COG-GTM/metamask-mobile.git
cd metamask-mobile
yarn install
```

### Verify Bitcoin Dependencies

Run the dependency checker to confirm everything is ready:

```bash
./scripts/bitcoin/check-bitcoin-deps.sh
```

This checks for:
- Node.js and Yarn availability
- Required npm packages (`bitcoin-address-validation`, `@metamask/bitcoin-wallet-snap`, `@metamask/keyring-api`)
- Connectivity to public Bitcoin APIs
- Optional tools (curl, jq)

---

## Quick Start

```bash
# 1. Verify dependencies
./scripts/bitcoin/check-bitcoin-deps.sh

# 2. Test Bitcoin API connectivity
./scripts/bitcoin/test-bitcoin-api.sh testnet

# 3. Generate test addresses file
./scripts/bitcoin/generate-test-addresses.sh

# 4. Run Bitcoin-related tests
yarn test --findRelatedTests app/core/Bitcoin/__tests__/bitcoin-config.test.ts

# 5. (Optional) Request testnet BTC
./scripts/bitcoin/request-testnet-btc.sh tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx testnet
```

---

## Environment Configuration

Bitcoin-specific environment variables go in your `.js.env` file (see `.js.env.example` for the standard MetaMask env vars).

### Bitcoin Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MM_BITCOIN_API_URL` | `https://blockstream.info/testnet/api` | Primary Bitcoin API base URL |
| `MM_BITCOIN_FALLBACK_API_URL` | `https://mempool.space/testnet/api` | Fallback Bitcoin API base URL |
| `MM_BITCOIN_NETWORK` | `testnet` | Bitcoin network: `testnet`, `signet`, or `regtest` |
| `MM_BITCOIN_DEBUG` | `false` | Enable verbose Bitcoin logging |

### Adding to `.js.env`

Append these to your existing `.js.env` file:

```bash
# Bitcoin Development Configuration
export MM_BITCOIN_API_URL="https://blockstream.info/testnet/api"
export MM_BITCOIN_FALLBACK_API_URL="https://mempool.space/testnet/api"
export MM_BITCOIN_NETWORK="testnet"
export MM_BITCOIN_DEBUG="true"
```

### Using Signet Instead of Testnet

Signet is more reliable than testnet (less spam, consistent block times). To use signet:

```bash
export MM_BITCOIN_API_URL="https://mempool.space/signet/api"
export MM_BITCOIN_FALLBACK_API_URL="https://mempool.space/signet/api"
export MM_BITCOIN_NETWORK="signet"
```

---

## API Endpoint Configuration

MetaMask Mobile's Bitcoin support uses public REST APIs rather than requiring a full Bitcoin node. Two providers are configured:

### Blockstream Esplora API

- **Docs**: https://github.com/Blockstream/esplora/blob/master/API.md
- **Mainnet**: `https://blockstream.info/api`
- **Testnet**: `https://blockstream.info/testnet/api`
- **Rate limits**: Generally lenient, no API key required
- **Used for**: Address lookups, UTXO queries, transaction broadcasts, fee estimates

### Mempool.space API

- **Docs**: https://mempool.space/docs/api/rest
- **Mainnet**: `https://mempool.space/api`
- **Testnet**: `https://mempool.space/testnet/api`
- **Signet**: `https://mempool.space/signet/api`
- **Rate limits**: Lenient, no API key required
- **Used for**: Fee recommendations, mempool info, fallback for all operations

### Common API Endpoints

| Endpoint | Description | Example |
|----------|-------------|---------|
| `GET /blocks/tip/height` | Current block height | `curl https://blockstream.info/testnet/api/blocks/tip/height` |
| `GET /address/:addr` | Address info & balance | `curl https://blockstream.info/testnet/api/address/tb1q...` |
| `GET /address/:addr/utxo` | UTXOs for address | `curl https://blockstream.info/testnet/api/address/tb1q.../utxo` |
| `GET /fee-estimates` | Fee rate estimates | `curl https://blockstream.info/testnet/api/fee-estimates` |
| `POST /tx` | Broadcast raw tx hex | `curl -d '<hex>' https://blockstream.info/testnet/api/tx` |
| `GET /tx/:txid` | Transaction details | `curl https://blockstream.info/testnet/api/tx/<txid>` |

---

## Testnet Wallet Setup

### Using Test Addresses

For development and unit testing, use the well-known test vectors provided in:
- `app/core/Bitcoin/__tests__/fixtures/test-addresses.json`

Generate the file:
```bash
./scripts/bitcoin/generate-test-addresses.sh
```

### Getting Testnet BTC

Use the faucet helper script:

```bash
./scripts/bitcoin/request-testnet-btc.sh <your-testnet-address> testnet
# or for signet:
./scripts/bitcoin/request-testnet-btc.sh <your-testnet-address> signet
```

**Testnet faucets** (manual, require captcha):
- https://coinfaucet.eu/en/btc-testnet/
- https://bitcoinfaucet.uo1.net/

**Signet faucets**:
- https://signetfaucet.com/
- https://mempool.space/signet/faucet

### Checking Balance

```bash
# Testnet
curl -s https://blockstream.info/testnet/api/address/<address> | jq '.chain_stats'

# Signet
curl -s https://mempool.space/signet/api/address/<address> | jq '.chain_stats'
```

---

## Development Scripts

All scripts are in `scripts/bitcoin/`:

| Script | Purpose |
|--------|---------|
| `check-bitcoin-deps.sh` | Verify all Bitcoin dev dependencies |
| `test-bitcoin-api.sh [network]` | Test Bitcoin API connectivity |
| `generate-test-addresses.sh` | Generate test address fixtures |
| `request-testnet-btc.sh <addr> [network]` | Request testnet BTC from faucets |

---

## Architecture Overview

### Existing Multichain Support

MetaMask Mobile already has partial Bitcoin/Solana multichain support:

```
app/core/Multichain/
├── constants.ts       # CAIP-2 chain IDs, token images, block explorers
├── networks.ts        # Block explorer URL formatting utilities
├── utils.ts           # Address validation, account type checks
└── test/              # Existing multichain tests

app/core/SnapKeyring/
├── BitcoinWalletSnap.ts          # Bitcoin Wallet Snap integration (gated)
├── MultichainWalletSnapClient.ts # Generic multichain snap client
└── utils/                        # Account naming, snap utilities

app/selectors/multichain/
├── multichain.ts      # Balance selectors, fiat display, native assets
└── evm.ts             # EVM-specific selectors
```

### New Bitcoin Infrastructure (this PR)

```
app/core/Bitcoin/
├── config/
│   ├── index.ts           # Barrel exports
│   ├── networks.ts        # Network configs, API endpoints, constants
│   └── environment.ts     # Env var definitions and defaults
└── __tests__/
    ├── bitcoin-config.test.ts       # Config unit tests
    ├── bitcoin-test-utils.test.ts   # Test utility tests
    ├── fixtures/
    │   ├── test-addresses.json      # Well-known test addresses
    │   ├── mock-transactions.json   # Mock transaction data
    │   ├── mock-utxos.json          # Mock UTXO sets
    │   └── mock-api-responses.json  # Mock Blockstream/Mempool responses
    └── helpers/
        └── bitcoin-test-utils.ts    # Test factory functions and utilities

scripts/bitcoin/
├── check-bitcoin-deps.sh       # Dependency verification
├── test-bitcoin-api.sh          # API connectivity test
├── generate-test-addresses.sh   # Test address generation
└── request-testnet-btc.sh       # Testnet faucet helper
```

### Key Concepts

- **BtcScope**: CAIP-2 namespace from `@metamask/keyring-api` (`bip122:000000000019d6689c085ae165831e93` for mainnet)
- **UTXO**: Unspent Transaction Output — Bitcoin's fundamental unit of spendable funds
- **Satoshis**: Smallest Bitcoin unit (1 BTC = 100,000,000 satoshis)
- **Bech32 (P2WPKH)**: Modern SegWit address format (prefix `bc1` mainnet, `tb1` testnet)
- **Esplora API**: Blockstream's open-source Bitcoin block explorer API format

---

## Troubleshooting

### "bitcoin-address-validation is not installed"

```bash
yarn install
```

### API connectivity test fails

1. Check your internet connection
2. Try the other provider (Blockstream vs Mempool.space)
3. Some corporate networks block cryptocurrency-related domains

### Tests fail with "Cannot find module"

Ensure you've built after adding new config files:
```bash
yarn lint:tsc  # TypeScript check
```

### "ONLY_INCLUDE_IF(bitcoin)" gated code

The Bitcoin Wallet Snap (`BitcoinWalletSnap.ts`) is gated behind a preprocessor directive. For Flask builds:
```bash
export METAMASK_BUILD_TYPE='flask'
```

### Signet vs Testnet

| Feature | Testnet | Signet |
|---------|---------|--------|
| Block time | ~10 min (variable) | ~10 min (consistent) |
| Spam | High | Low |
| Faucet availability | Variable | More reliable |
| Address prefix | `tb1` | `tb1` |
| Recommended for | Legacy compatibility | New development |

**Recommendation**: Use **signet** for new Bitcoin feature development due to its more reliable block production and cleaner mempool.
