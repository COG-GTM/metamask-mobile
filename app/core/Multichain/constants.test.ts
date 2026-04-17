import {
  MULTICHAIN_TOKEN_IMAGES,
  MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP,
  MULTICHAIN_ACCOUNT_TYPE_TO_MAINNET,
  PRICE_API_CURRENCIES,
} from './constants';
import { BtcScope, SolScope, BtcAccountType, SolAccountType } from '@metamask/keyring-api';

describe('Multichain constants', () => {
  describe('MULTICHAIN_TOKEN_IMAGES', () => {
    it('has BTC mainnet image', () => {
      expect(MULTICHAIN_TOKEN_IMAGES[BtcScope.Mainnet]).toBeDefined();
    });

    it('has SOL mainnet image', () => {
      expect(MULTICHAIN_TOKEN_IMAGES[SolScope.Mainnet]).toBeDefined();
    });

    it('has BTC testnet image', () => {
      expect(MULTICHAIN_TOKEN_IMAGES[BtcScope.Testnet]).toBeDefined();
    });
  });

  describe('MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP', () => {
    it('has BTC mainnet explorer', () => {
      const btcExplorer = MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[BtcScope.Mainnet];
      expect(btcExplorer.url).toContain('mempool.space');
      expect(btcExplorer.address).toContain('{address}');
      expect(btcExplorer.transaction).toContain('{txId}');
    });

    it('has SOL mainnet explorer', () => {
      const solExplorer = MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[SolScope.Mainnet];
      expect(solExplorer.url).toContain('solscan.io');
    });

    it('has BTC testnet explorer', () => {
      const btcTestExplorer = MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[BtcScope.Testnet];
      expect(btcTestExplorer.address).toContain('testnet');
    });

    it('has SOL devnet explorer', () => {
      const solDevExplorer = MULTICHAIN_NETWORK_BLOCK_EXPLORER_FORMAT_URLS_MAP[SolScope.Devnet];
      expect(solDevExplorer.address).toContain('devnet');
    });
  });

  describe('MULTICHAIN_ACCOUNT_TYPE_TO_MAINNET', () => {
    it('maps BTC P2wpkh to BTC mainnet', () => {
      expect(MULTICHAIN_ACCOUNT_TYPE_TO_MAINNET[BtcAccountType.P2wpkh]).toBe(BtcScope.Mainnet);
    });

    it('maps SOL DataAccount to SOL mainnet', () => {
      expect(MULTICHAIN_ACCOUNT_TYPE_TO_MAINNET[SolAccountType.DataAccount]).toBe(SolScope.Mainnet);
    });
  });

  describe('PRICE_API_CURRENCIES', () => {
    it('contains usd', () => {
      expect(PRICE_API_CURRENCIES).toContain('usd');
    });

    it('contains eur', () => {
      expect(PRICE_API_CURRENCIES).toContain('eur');
    });

    it('contains gbp', () => {
      expect(PRICE_API_CURRENCIES).toContain('gbp');
    });

    it('contains btc', () => {
      expect(PRICE_API_CURRENCIES).toContain('btc');
    });

    it('contains eth', () => {
      expect(PRICE_API_CURRENCIES).toContain('eth');
    });

    it('has expected number of currencies', () => {
      expect(PRICE_API_CURRENCIES.length).toBeGreaterThan(20);
    });
  });
});
