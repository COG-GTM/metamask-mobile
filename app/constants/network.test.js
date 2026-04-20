import {
  MAINNET,
  HOMESTEAD,
  GOERLI,
  SEPOLIA,
  LINEA_GOERLI,
  LINEA_SEPOLIA,
  LINEA_MAINNET,
  MEGAETH_TESTNET,
  RPC,
  NO_RPC_BLOCK_EXPLORER,
  PRIVATENETWORK,
  DEFAULT_MAINNET_CUSTOM_NAME,
  IPFS_DEFAULT_GATEWAY_URL,
  NETWORKS_CHAIN_ID,
  DEPRECATED_NETWORKS,
  CHAINLIST_CURRENCY_SYMBOLS_MAP,
  CURRENCY_SYMBOL_BY_CHAIN_ID,
  TEST_NETWORK_IDS,
} from './network';

describe('network constants', () => {
  describe('network name constants', () => {
    it('defines MAINNET', () => {
      expect(MAINNET).toBe('mainnet');
    });

    it('defines HOMESTEAD', () => {
      expect(HOMESTEAD).toBe('homestead');
    });

    it('defines test networks', () => {
      expect(GOERLI).toBe('goerli');
      expect(SEPOLIA).toBe('sepolia');
      expect(LINEA_GOERLI).toBe('linea-goerli');
      expect(LINEA_SEPOLIA).toBe('linea-sepolia');
    });

    it('defines LINEA_MAINNET', () => {
      expect(LINEA_MAINNET).toBe('linea-mainnet');
    });

    it('defines MEGAETH_TESTNET', () => {
      expect(MEGAETH_TESTNET).toBe('megaeth-testnet');
    });
  });

  describe('utility constants', () => {
    it('defines RPC', () => {
      expect(RPC).toBeDefined();
    });

    it('defines NO_RPC_BLOCK_EXPLORER', () => {
      expect(NO_RPC_BLOCK_EXPLORER).toBe('NO_BLOCK_EXPLORER');
    });

    it('defines PRIVATENETWORK', () => {
      expect(PRIVATENETWORK).toBe('PRIVATENETWORK');
    });

    it('defines DEFAULT_MAINNET_CUSTOM_NAME', () => {
      expect(DEFAULT_MAINNET_CUSTOM_NAME).toBe('Ethereum Main Custom');
    });

    it('defines IPFS_DEFAULT_GATEWAY_URL', () => {
      expect(IPFS_DEFAULT_GATEWAY_URL).toContain('ipfs');
    });
  });

  describe('NETWORKS_CHAIN_ID', () => {
    it('defines MAINNET chain ID as hex', () => {
      expect(NETWORKS_CHAIN_ID.MAINNET).toMatch(/^0x/);
    });

    it('defines all expected chain IDs', () => {
      expect(NETWORKS_CHAIN_ID.MAINNET).toBeDefined();
      expect(NETWORKS_CHAIN_ID.OPTIMISM).toBeDefined();
      expect(NETWORKS_CHAIN_ID.BSC).toBeDefined();
      expect(NETWORKS_CHAIN_ID.POLYGON).toBeDefined();
      expect(NETWORKS_CHAIN_ID.BASE).toBeDefined();
      expect(NETWORKS_CHAIN_ID.ARBITRUM).toBeDefined();
      expect(NETWORKS_CHAIN_ID.AVAXCCHAIN).toBeDefined();
      expect(NETWORKS_CHAIN_ID.SEPOLIA).toBeDefined();
      expect(NETWORKS_CHAIN_ID.LINEA_MAINNET).toBeDefined();
      expect(NETWORKS_CHAIN_ID.ZKSYNC_ERA).toBeDefined();
    });

    it('all chain IDs are hex strings', () => {
      Object.values(NETWORKS_CHAIN_ID).forEach((chainId) => {
        expect(chainId).toMatch(/^0x[0-9a-fA-F]+$/);
      });
    });
  });

  describe('DEPRECATED_NETWORKS', () => {
    it('is a non-empty array', () => {
      expect(Array.isArray(DEPRECATED_NETWORKS)).toBe(true);
      expect(DEPRECATED_NETWORKS.length).toBeGreaterThan(0);
    });

    it('contains GOERLI', () => {
      expect(DEPRECATED_NETWORKS).toContain(NETWORKS_CHAIN_ID.GOERLI);
    });
  });

  describe('CHAINLIST_CURRENCY_SYMBOLS_MAP', () => {
    it('maps network names to currency symbols', () => {
      expect(CHAINLIST_CURRENCY_SYMBOLS_MAP.MAINNET).toBe('ETH');
      expect(CHAINLIST_CURRENCY_SYMBOLS_MAP.BNB).toBe('BNB');
      expect(CHAINLIST_CURRENCY_SYMBOLS_MAP.AVALANCHE).toBe('AVAX');
    });
  });

  describe('CURRENCY_SYMBOL_BY_CHAIN_ID', () => {
    it('maps chain IDs to currency symbols', () => {
      expect(CURRENCY_SYMBOL_BY_CHAIN_ID[NETWORKS_CHAIN_ID.MAINNET]).toBe('ETH');
      expect(CURRENCY_SYMBOL_BY_CHAIN_ID[NETWORKS_CHAIN_ID.BSC]).toBe('BNB');
    });
  });

  describe('TEST_NETWORK_IDS', () => {
    it('is a non-empty array of chain IDs', () => {
      expect(Array.isArray(TEST_NETWORK_IDS)).toBe(true);
      expect(TEST_NETWORK_IDS.length).toBeGreaterThan(0);
    });

    it('contains SEPOLIA', () => {
      expect(TEST_NETWORK_IDS).toContain(NETWORKS_CHAIN_ID.SEPOLIA);
    });

    it('does not contain MAINNET', () => {
      expect(TEST_NETWORK_IDS).not.toContain(NETWORKS_CHAIN_ID.MAINNET);
    });
  });
});
