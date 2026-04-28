import { BtcScope } from '@metamask/keyring-api';
import {
  SATOSHIS_PER_BTC,
  BitcoinNetworkType,
  BITCOIN_ADDRESS_PREFIXES,
  BITCOIN_CONFIRMATION_THRESHOLDS,
} from '../../config/networks';

import mockUtxos from '../fixtures/mock-utxos.json';
import mockTransactions from '../fixtures/mock-transactions.json';
import mockApiResponses from '../fixtures/mock-api-responses.json';

/**
 * Re-export fixtures for convenient test imports.
 */
export { mockUtxos, mockTransactions, mockApiResponses };

/**
 * Bitcoin UTXO shape matching the Blockstream/Mempool.space API.
 */
export interface MockUtxo {
  txid: string;
  vout: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
  value: number;
}

/**
 * Create a mock UTXO with sensible defaults.
 */
export function createMockUtxo(overrides: Partial<MockUtxo> = {}): MockUtxo {
  const defaultStatus: MockUtxo['status'] = {
    confirmed: true,
    block_height: 2500000,
    block_hash:
      '000000000000000eaa9e43748768cd8bf34f43adb47e7f27ccabc8a80e3e8888',
    block_time: 1700000000,
  };

  const mergedStatus = overrides.status
    ? { ...defaultStatus, ...overrides.status }
    : defaultStatus;

  const { status: _unusedStatus, ...restOverrides } = overrides;

  return {
    txid: 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2',
    vout: 0,
    value: 100000,
    ...restOverrides,
    status: mergedStatus,
  };
}

/**
 * Create a set of mock UTXOs totaling the given satoshi amount.
 */
export function createMockUtxoSet(
  totalSatoshis: number,
  count = 1,
): MockUtxo[] {
  const perUtxo = Math.floor(totalSatoshis / count);
  const remainder = totalSatoshis - perUtxo * count;

  return Array.from({ length: count }, (_, i) =>
    createMockUtxo({
      txid: `${String(i).padStart(64, 'a')}`,
      vout: 0,
      value: i === 0 ? perUtxo + remainder : perUtxo,
    }),
  );
}

/**
 * Convert BTC to satoshis.
 */
export function btcToSatoshis(btc: number): number {
  return Math.round(btc * SATOSHIS_PER_BTC);
}

/**
 * Convert satoshis to BTC.
 */
export function satoshisToBtc(satoshis: number): number {
  return satoshis / SATOSHIS_PER_BTC;
}

/**
 * Well-known testnet addresses for use in tests.
 */
export const TEST_ADDRESSES = {
  testnet: {
    bech32: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
    nestedSegwit: '2N3oefVeg6stiTb5Kh3ozCRPPqnMgraPNKT',
    legacy: 'mipcBbFg9gMiCh81Kj8tqqdgoZub1ZJRfn',
  },
  signet: {
    bech32: 'tb1qw508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx',
  },
  regtest: {
    bech32: 'bcrt1qs758ursh4q9z627kt3pp5yysm78ddny6txaqgw',
  },
  mainnet: {
    bech32: 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4',
  },
} as const;

/**
 * Create mock Blockstream Esplora API responses.
 */
export function createMockBlockstreamResponse(
  endpoint: string,
  overrides: Record<string, unknown> = {},
): unknown {
  switch (endpoint) {
    case 'fee-estimates':
      return {
        ...mockApiResponses.blockstreamApi.feeEstimates,
        ...overrides,
      };
    case 'address':
      return {
        ...mockApiResponses.blockstreamApi.addressInfo,
        ...overrides,
      };
    case 'tip/height':
      return overrides.height ?? mockApiResponses.blockstreamApi.tipHeight;
    case 'tip/hash':
      return overrides.hash ?? mockApiResponses.blockstreamApi.tipHash;
    default:
      return overrides;
  }
}

/**
 * Create mock Mempool.space API responses.
 */
export function createMockMempoolResponse(
  endpoint: string,
  overrides: Record<string, unknown> = {},
): unknown {
  switch (endpoint) {
    case 'fees/recommended':
      return {
        ...mockApiResponses.mempoolSpaceApi.recommendedFees,
        ...overrides,
      };
    case 'mempool':
      return {
        ...mockApiResponses.mempoolSpaceApi.mempoolInfo,
        ...overrides,
      };
    default:
      return overrides;
  }
}

/**
 * Returns the BtcScope for a given network type.
 */
export function getBtcScopeForNetwork(
  network: BitcoinNetworkType,
): string {
  switch (network) {
    case BitcoinNetworkType.Mainnet:
      return BtcScope.Mainnet;
    case BitcoinNetworkType.Testnet:
    case BitcoinNetworkType.Signet:
    case BitcoinNetworkType.Regtest:
      return BtcScope.Testnet;
    default:
      return BtcScope.Testnet;
  }
}

/**
 * Asserts that a string is a valid Bitcoin address for the given network.
 */
export function isValidAddressFormat(
  address: string,
  network: keyof typeof BITCOIN_ADDRESS_PREFIXES,
): boolean {
  const prefixes = BITCOIN_ADDRESS_PREFIXES[network];
  return (
    address.startsWith(prefixes.bech32) ||
    address.startsWith(prefixes.p2pkh) ||
    address.startsWith(prefixes.p2sh)
  );
}

/**
 * Get the minimum confirmations threshold for a network.
 */
export function getConfirmationThreshold(
  network: BitcoinNetworkType,
): number {
  return BITCOIN_CONFIRMATION_THRESHOLDS[network];
}
