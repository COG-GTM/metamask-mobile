# Bitcoin Testing Guide

This guide covers testing patterns, conventions, and infrastructure for Bitcoin native support in MetaMask Mobile.

## Table of Contents

- [Quick Reference](#quick-reference)
- [Unit Testing Patterns](#unit-testing-patterns)
- [Test Fixtures](#test-fixtures)
- [Mock Data Factories](#mock-data-factories)
- [Integration Testing Approach](#integration-testing-approach)
- [Testing Conventions](#testing-conventions)
- [Running Tests](#running-tests)

---

## Quick Reference

```bash
# Run all Bitcoin tests
yarn test --findRelatedTests app/core/Bitcoin/__tests__/bitcoin-config.test.ts app/core/Bitcoin/__tests__/bitcoin-test-utils.test.ts

# Run a specific test file
yarn test app/core/Bitcoin/__tests__/bitcoin-config.test.ts

# Run with coverage
yarn test --coverage app/core/Bitcoin/

# TypeScript check
yarn lint:tsc

# Lint
yarn lint
```

---

## Unit Testing Patterns

### Testing Configuration Constants

Test that configuration values are correct and complete:

```typescript
import {
  BITCOIN_ADDRESS_PREFIXES,
  SATOSHIS_PER_BTC,
} from '../config/networks';

describe('Bitcoin address prefixes', () => {
  it('defines testnet bech32 prefix', () => {
    expect(BITCOIN_ADDRESS_PREFIXES.testnet.bech32).toBe('tb1');
  });
});
```

### Testing with Mock UTXOs

Use the provided factory functions to create test data:

```typescript
import {
  createMockUtxo,
  createMockUtxoSet,
  btcToSatoshis,
} from './helpers/bitcoin-test-utils';

describe('UTXO selection', () => {
  it('selects sufficient UTXOs for a payment', () => {
    const utxos = createMockUtxoSet(btcToSatoshis(0.01), 3);
    const total = utxos.reduce((sum, u) => sum + u.value, 0);
    expect(total).toBe(btcToSatoshis(0.01));
  });
});
```

### Testing with Mock API Responses

Use the mock response factories to simulate API calls without network:

```typescript
import {
  createMockBlockstreamResponse,
  createMockMempoolResponse,
} from './helpers/bitcoin-test-utils';

describe('Fee estimation', () => {
  it('parses Blockstream fee estimates', () => {
    const fees = createMockBlockstreamResponse('fee-estimates') as Record<string, number>;
    expect(fees['1']).toBeGreaterThan(0); // next-block fee
    expect(fees['6']).toBeLessThanOrEqual(fees['1']); // 6-block fee <= 1-block
  });

  it('parses Mempool.space recommended fees', () => {
    const fees = createMockMempoolResponse('fees/recommended') as Record<string, number>;
    expect(fees.fastestFee).toBeGreaterThanOrEqual(fees.economyFee);
  });
});
```

### Testing Address Validation

Use the existing `bitcoin-address-validation` library (already a project dependency):

```typescript
import { validate, Network } from 'bitcoin-address-validation';
import { TEST_ADDRESSES } from './helpers/bitcoin-test-utils';

describe('Address validation', () => {
  it('validates testnet bech32 address', () => {
    expect(validate(TEST_ADDRESSES.testnet.bech32, Network.testnet)).toBe(true);
  });

  it('rejects testnet address on mainnet', () => {
    expect(validate(TEST_ADDRESSES.testnet.bech32, Network.mainnet)).toBe(false);
  });
});
```

---

## Test Fixtures

All fixtures are JSON files in `app/core/Bitcoin/__tests__/fixtures/`:

### `test-addresses.json`

Well-known Bitcoin test vector addresses organized by network and format:

```json
{
  "testnet": {
    "bech32": ["tb1q..."],
    "nestedSegwit": ["2N..."],
    "legacy": ["m..."]
  },
  "signet": { "bech32": ["tb1q..."] },
  "regtest": { "bech32": ["bcrt1..."] }
}
```

### `mock-transactions.json`

Complete transaction objects matching the Blockstream Esplora API format:
- `confirmed` — a mined transaction with block info
- `unconfirmed` — a mempool transaction

### `mock-utxos.json`

UTXO sets for different test scenarios:
- `singleUtxo` — one confirmed UTXO
- `multipleUtxos` — mix of confirmed and unconfirmed
- `emptyUtxoSet` — no UTXOs (empty wallet)
- `dustUtxos` — very small UTXOs near the dust threshold

### `mock-api-responses.json`

Canned API responses for both providers:
- `blockstreamApi` — fee estimates, address info, tip height/hash
- `mempoolSpaceApi` — recommended fees, mempool info
- `errorResponses` — 404, 500, 429 error shapes

---

## Mock Data Factories

The `bitcoin-test-utils.ts` helper module provides factory functions:

| Function | Description |
|----------|-------------|
| `createMockUtxo(overrides?)` | Single UTXO with configurable fields |
| `createMockUtxoSet(totalSats, count)` | Multiple UTXOs summing to exact total |
| `btcToSatoshis(btc)` | Convert BTC to satoshis |
| `satoshisToBtc(sats)` | Convert satoshis to BTC |
| `createMockBlockstreamResponse(endpoint, overrides?)` | Mock Blockstream API response |
| `createMockMempoolResponse(endpoint, overrides?)` | Mock Mempool.space API response |
| `isValidAddressFormat(address, network)` | Check address prefix |
| `getBtcScopeForNetwork(network)` | Get CAIP-2 scope for network type |
| `getConfirmationThreshold(network)` | Get min confirmations for network |

### Usage Pattern

```typescript
import {
  createMockUtxo,
  btcToSatoshis,
  TEST_ADDRESSES,
} from '../__tests__/helpers/bitcoin-test-utils';

// In your test:
const utxo = createMockUtxo({
  value: btcToSatoshis(0.5),
  status: { confirmed: true },
});
```

---

## Integration Testing Approach

### API Integration Tests (Manual)

Use the shell scripts to verify API connectivity:

```bash
# Test all endpoints for a network
./scripts/bitcoin/test-bitcoin-api.sh testnet
./scripts/bitcoin/test-bitcoin-api.sh signet
```

### End-to-End Considerations

Bitcoin E2E testing will be added in later phases. For now:

1. **Unit tests** cover all configuration, utilities, and mock data
2. **API scripts** verify external connectivity manually
3. **Existing multichain tests** in `app/core/Multichain/test/` cover address validation and scope mapping

### Mocking External Dependencies

When testing code that calls Bitcoin APIs, mock at the network layer:

```typescript
// Example: mocking fetch for Bitcoin API calls
global.fetch = jest.fn().mockImplementation((url: string) => {
  if (url.includes('/fee-estimates')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(createMockBlockstreamResponse('fee-estimates')),
    });
  }
  // ... other endpoints
});
```

---

## Testing Conventions

### File Organization

Follow the existing MetaMask Mobile pattern:

```
app/core/Bitcoin/
├── config/                     # Source code
│   ├── networks.ts
│   └── environment.ts
└── __tests__/                  # Tests colocated with source
    ├── bitcoin-config.test.ts  # Tests for config/
    ├── fixtures/               # JSON test data
    └── helpers/                # Reusable test utilities
```

### Naming Conventions

- Test files: `<module-name>.test.ts`
- Fixture files: `mock-<resource>.json`
- Helper files: `<purpose>-test-utils.ts`
- Describe blocks: Match the module being tested
- It blocks: Describe expected behavior clearly

### Test Structure

```typescript
describe('ModuleName', () => {
  describe('functionOrFeature', () => {
    it('does the expected thing', () => {
      // Arrange
      const input = createMockUtxo();

      // Act
      const result = someFunction(input);

      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### Satoshi Math

Always use integer satoshis for calculations. Use the conversion helpers:

```typescript
// CORRECT — integer satoshi math
const fee = btcToSatoshis(0.0001); // 10000 satoshis
const total = utxoValue - fee;

// AVOID — floating-point BTC math (precision issues)
const fee = 0.0001;
const total = 0.001 - fee; // May not equal 0.0009 exactly!
```

---

## Running Tests

### Individual Test Files

```bash
yarn test app/core/Bitcoin/__tests__/bitcoin-config.test.ts
yarn test app/core/Bitcoin/__tests__/bitcoin-test-utils.test.ts
```

### All Related Tests

```bash
yarn test --findRelatedTests app/core/Bitcoin/config/networks.ts
```

### With Verbose Output

```bash
yarn test --verbose app/core/Bitcoin/
```

### TypeScript Validation

```bash
yarn lint:tsc
```

### Lint Check

```bash
yarn lint
```

### Full Validation Pipeline

```bash
# The standard validation for any Bitcoin-related changes:
yarn lint:tsc && \
yarn test --findRelatedTests app/core/Bitcoin/config/networks.ts app/core/Bitcoin/config/environment.ts && \
yarn lint
```
