import {
  createMockUtxo,
  createMockUtxoSet,
  btcToSatoshis,
  satoshisToBtc,
  TEST_ADDRESSES,
  isValidAddressFormat,
  createMockBlockstreamResponse,
  createMockMempoolResponse,
  mockUtxos,
  mockTransactions,
  mockApiResponses,
} from './helpers/bitcoin-test-utils';
import { BitcoinNetworkType } from '../config/networks';

describe('Bitcoin Test Utilities', () => {
  describe('createMockUtxo', () => {
    it('creates a UTXO with default values', () => {
      const utxo = createMockUtxo();
      expect(utxo.txid).toBeTruthy();
      expect(utxo.vout).toBe(0);
      expect(utxo.value).toBe(100000);
      expect(utxo.status.confirmed).toBe(true);
    });

    it('allows overriding values', () => {
      const utxo = createMockUtxo({ value: 50000, vout: 2 });
      expect(utxo.value).toBe(50000);
      expect(utxo.vout).toBe(2);
    });

    it('allows overriding status', () => {
      const utxo = createMockUtxo({
        status: { confirmed: false },
      });
      expect(utxo.status.confirmed).toBe(false);
    });
  });

  describe('createMockUtxoSet', () => {
    it('creates a single UTXO totaling the given amount', () => {
      const utxos = createMockUtxoSet(100000);
      expect(utxos).toHaveLength(1);
      expect(utxos[0].value).toBe(100000);
    });

    it('creates multiple UTXOs that sum to the total', () => {
      const total = 150000;
      const utxos = createMockUtxoSet(total, 3);
      expect(utxos).toHaveLength(3);
      const sum = utxos.reduce((acc, u) => acc + u.value, 0);
      expect(sum).toBe(total);
    });

    it('assigns unique txids', () => {
      const utxos = createMockUtxoSet(100000, 5);
      const txids = new Set(utxos.map((u) => u.txid));
      expect(txids.size).toBe(5);
    });
  });

  describe('btcToSatoshis / satoshisToBtc', () => {
    it('converts 1 BTC to 100M satoshis', () => {
      expect(btcToSatoshis(1)).toBe(100_000_000);
    });

    it('converts 0.001 BTC to 100K satoshis', () => {
      expect(btcToSatoshis(0.001)).toBe(100_000);
    });

    it('converts 100M satoshis to 1 BTC', () => {
      expect(satoshisToBtc(100_000_000)).toBe(1);
    });

    it('round-trips correctly', () => {
      const btc = 0.12345678;
      expect(satoshisToBtc(btcToSatoshis(btc))).toBeCloseTo(btc, 8);
    });
  });

  describe('TEST_ADDRESSES', () => {
    it('testnet bech32 address starts with tb1', () => {
      expect(TEST_ADDRESSES.testnet.bech32).toMatch(/^tb1/);
    });

    it('mainnet bech32 address starts with bc1', () => {
      expect(TEST_ADDRESSES.mainnet.bech32).toMatch(/^bc1/);
    });

    it('regtest bech32 address starts with bcrt1', () => {
      expect(TEST_ADDRESSES.regtest.bech32).toMatch(/^bcrt1/);
    });
  });

  describe('isValidAddressFormat', () => {
    it('validates testnet bech32 address', () => {
      expect(
        isValidAddressFormat(TEST_ADDRESSES.testnet.bech32, 'testnet'),
      ).toBe(true);
    });

    it('validates mainnet bech32 address', () => {
      expect(
        isValidAddressFormat(TEST_ADDRESSES.mainnet.bech32, 'mainnet'),
      ).toBe(true);
    });

    it('rejects testnet address on mainnet', () => {
      expect(
        isValidAddressFormat(TEST_ADDRESSES.testnet.bech32, 'mainnet'),
      ).toBe(false);
    });

    it('validates regtest bech32 address', () => {
      expect(
        isValidAddressFormat(TEST_ADDRESSES.regtest.bech32, 'regtest'),
      ).toBe(true);
    });
  });

  describe('createMockBlockstreamResponse', () => {
    it('returns fee estimates', () => {
      const fees = createMockBlockstreamResponse('fee-estimates');
      expect(fees).toHaveProperty('1');
      expect(fees).toHaveProperty('6');
    });

    it('returns address info', () => {
      const info = createMockBlockstreamResponse('address') as Record<
        string,
        unknown
      >;
      expect(info).toHaveProperty('address');
      expect(info).toHaveProperty('chain_stats');
    });

    it('allows overrides', () => {
      const fees = createMockBlockstreamResponse('fee-estimates', {
        '1': 50,
      }) as Record<string, number>;
      expect(fees['1']).toBe(50);
    });
  });

  describe('createMockMempoolResponse', () => {
    it('returns recommended fees', () => {
      const fees = createMockMempoolResponse('fees/recommended') as Record<
        string,
        number
      >;
      expect(fees).toHaveProperty('fastestFee');
      expect(fees).toHaveProperty('economyFee');
    });

    it('returns mempool info', () => {
      const info = createMockMempoolResponse('mempool') as Record<
        string,
        unknown
      >;
      expect(info).toHaveProperty('count');
      expect(info).toHaveProperty('vsize');
    });
  });

  describe('JSON fixtures', () => {
    it('mock UTXOs are properly structured', () => {
      expect(mockUtxos.singleUtxo).toHaveLength(1);
      expect(mockUtxos.multipleUtxos.length).toBeGreaterThan(1);
      expect(mockUtxos.emptyUtxoSet).toHaveLength(0);
      expect(mockUtxos.dustUtxos).toBeDefined();
    });

    it('mock transactions have confirmed and unconfirmed variants', () => {
      expect(mockTransactions.confirmed.status.confirmed).toBe(true);
      expect(mockTransactions.unconfirmed.status.confirmed).toBe(false);
    });

    it('mock API responses cover both providers', () => {
      expect(mockApiResponses.blockstreamApi).toBeDefined();
      expect(mockApiResponses.mempoolSpaceApi).toBeDefined();
      expect(mockApiResponses.errorResponses).toBeDefined();
    });
  });
});
