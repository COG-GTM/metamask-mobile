import { BtcScope } from '@metamask/keyring-api';
import {
  BitcoinNetworkType,
  BLOCKSTREAM_API_ENDPOINTS,
  MEMPOOL_API_ENDPOINTS,
  DEFAULT_BITCOIN_TESTNET_API,
  DEFAULT_BITCOIN_SIGNET_API,
  BITCOIN_CAIP2_CHAIN_IDS,
  BITCOIN_TESTNET_FAUCETS,
  BITCOIN_ADDRESS_PREFIXES,
  BITCOIN_CONFIRMATION_THRESHOLDS,
  SATOSHIS_PER_BTC,
  MIN_RELAY_FEE_SAT_PER_BYTE,
} from '../config/networks';
import { BITCOIN_ENV_VARS, BITCOIN_ENV_DEFAULTS } from '../config/environment';

describe('Bitcoin Config: networks', () => {
  describe('BitcoinNetworkType', () => {
    it('defines all expected network types', () => {
      expect(BitcoinNetworkType.Mainnet).toBe('mainnet');
      expect(BitcoinNetworkType.Testnet).toBe('testnet');
      expect(BitcoinNetworkType.Signet).toBe('signet');
      expect(BitcoinNetworkType.Regtest).toBe('regtest');
    });
  });

  describe('Blockstream API endpoints', () => {
    it('has mainnet and testnet endpoints', () => {
      expect(BLOCKSTREAM_API_ENDPOINTS.mainnet).toBeDefined();
      expect(BLOCKSTREAM_API_ENDPOINTS.testnet).toBeDefined();
    });

    it('mainnet endpoint uses correct base URL', () => {
      expect(BLOCKSTREAM_API_ENDPOINTS.mainnet.baseUrl).toBe(
        'https://blockstream.info/api',
      );
    });

    it('testnet endpoint uses correct base URL', () => {
      expect(BLOCKSTREAM_API_ENDPOINTS.testnet.baseUrl).toBe(
        'https://blockstream.info/testnet/api',
      );
    });

    it('all endpoints have required fields', () => {
      Object.values(BLOCKSTREAM_API_ENDPOINTS).forEach((endpoint) => {
        expect(endpoint.name).toBeTruthy();
        expect(endpoint.baseUrl).toMatch(/^https:\/\//);
        expect(Object.values(BitcoinNetworkType)).toContain(endpoint.network);
      });
    });
  });

  describe('Mempool.space API endpoints', () => {
    it('has mainnet, testnet, and signet endpoints', () => {
      expect(MEMPOOL_API_ENDPOINTS.mainnet).toBeDefined();
      expect(MEMPOOL_API_ENDPOINTS.testnet).toBeDefined();
      expect(MEMPOOL_API_ENDPOINTS.signet).toBeDefined();
    });

    it('signet endpoint uses correct base URL', () => {
      expect(MEMPOOL_API_ENDPOINTS.signet.baseUrl).toBe(
        'https://mempool.space/signet/api',
      );
    });
  });

  describe('Default API endpoints', () => {
    it('default testnet API is Blockstream testnet', () => {
      expect(DEFAULT_BITCOIN_TESTNET_API).toBe(
        BLOCKSTREAM_API_ENDPOINTS.testnet,
      );
    });

    it('default signet API is Mempool.space signet', () => {
      expect(DEFAULT_BITCOIN_SIGNET_API).toBe(
        MEMPOOL_API_ENDPOINTS.signet,
      );
    });
  });

  describe('CAIP-2 chain identifiers', () => {
    it('aligns with MetaMask BtcScope values', () => {
      expect(BITCOIN_CAIP2_CHAIN_IDS.mainnet).toBe(BtcScope.Mainnet);
      expect(BITCOIN_CAIP2_CHAIN_IDS.testnet).toBe(BtcScope.Testnet);
    });
  });

  describe('Testnet faucets', () => {
    it('contains at least one faucet', () => {
      expect(BITCOIN_TESTNET_FAUCETS.length).toBeGreaterThan(0);
    });

    it('all faucets have name, url, and network', () => {
      BITCOIN_TESTNET_FAUCETS.forEach((faucet) => {
        expect(faucet.name).toBeTruthy();
        expect(faucet.url).toMatch(/^https:\/\//);
        expect(faucet.network).toBeTruthy();
      });
    });
  });

  describe('Address prefixes', () => {
    it('defines prefixes for all networks', () => {
      expect(BITCOIN_ADDRESS_PREFIXES.mainnet).toBeDefined();
      expect(BITCOIN_ADDRESS_PREFIXES.testnet).toBeDefined();
      expect(BITCOIN_ADDRESS_PREFIXES.signet).toBeDefined();
      expect(BITCOIN_ADDRESS_PREFIXES.regtest).toBeDefined();
    });

    it('mainnet bech32 prefix is bc1', () => {
      expect(BITCOIN_ADDRESS_PREFIXES.mainnet.bech32).toBe('bc1');
    });

    it('testnet bech32 prefix is tb1', () => {
      expect(BITCOIN_ADDRESS_PREFIXES.testnet.bech32).toBe('tb1');
    });

    it('regtest bech32 prefix is bcrt1', () => {
      expect(BITCOIN_ADDRESS_PREFIXES.regtest.bech32).toBe('bcrt1');
    });
  });

  describe('Confirmation thresholds', () => {
    it('mainnet requires 6 confirmations', () => {
      expect(BITCOIN_CONFIRMATION_THRESHOLDS[BitcoinNetworkType.Mainnet]).toBe(
        6,
      );
    });

    it('testnet requires 1 confirmation', () => {
      expect(BITCOIN_CONFIRMATION_THRESHOLDS[BitcoinNetworkType.Testnet]).toBe(
        1,
      );
    });
  });

  describe('Constants', () => {
    it('SATOSHIS_PER_BTC is 100 million', () => {
      expect(SATOSHIS_PER_BTC).toBe(100_000_000);
    });

    it('MIN_RELAY_FEE_SAT_PER_BYTE is 1', () => {
      expect(MIN_RELAY_FEE_SAT_PER_BYTE).toBe(1);
    });
  });
});

describe('Bitcoin Config: environment', () => {
  describe('BITCOIN_ENV_VARS', () => {
    it('defines all expected env var names', () => {
      expect(BITCOIN_ENV_VARS.BITCOIN_API_URL).toBe('MM_BITCOIN_API_URL');
      expect(BITCOIN_ENV_VARS.BITCOIN_FALLBACK_API_URL).toBe(
        'MM_BITCOIN_FALLBACK_API_URL',
      );
      expect(BITCOIN_ENV_VARS.BITCOIN_NETWORK).toBe('MM_BITCOIN_NETWORK');
      expect(BITCOIN_ENV_VARS.BITCOIN_DEBUG).toBe('MM_BITCOIN_DEBUG');
    });
  });

  describe('BITCOIN_ENV_DEFAULTS', () => {
    it('has default values for all env vars', () => {
      Object.values(BITCOIN_ENV_VARS).forEach((varName) => {
        expect(BITCOIN_ENV_DEFAULTS[varName]).toBeDefined();
      });
    });

    it('default network is testnet', () => {
      expect(
        BITCOIN_ENV_DEFAULTS[BITCOIN_ENV_VARS.BITCOIN_NETWORK],
      ).toBe('testnet');
    });

    it('default debug is false', () => {
      expect(
        BITCOIN_ENV_DEFAULTS[BITCOIN_ENV_VARS.BITCOIN_DEBUG],
      ).toBe('false');
    });
  });
});
