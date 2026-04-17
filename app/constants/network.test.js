import {
  MAINNET,
  SEPOLIA,
  LINEA_MAINNET,
  LINEA_SEPOLIA,
  GOERLI,
  RPC,
  NO_RPC_BLOCK_EXPLORER,
  PRIVATENETWORK,
  IPFS_DEFAULT_GATEWAY_URL,
  NETWORKS_CHAIN_ID,
  DEPRECATED_NETWORKS,
  CHAINLIST_CURRENCY_SYMBOLS_MAP,
  CURRENCY_SYMBOL_BY_CHAIN_ID,
  TEST_NETWORK_IDS,
} from './network';

describe('network constants', () => {
  it('MAINNET is mainnet', () => {
    expect(MAINNET).toBe('mainnet');
  });

  it('SEPOLIA is sepolia', () => {
    expect(SEPOLIA).toBe('sepolia');
  });

  it('LINEA_MAINNET is linea-mainnet', () => {
    expect(LINEA_MAINNET).toBe('linea-mainnet');
  });

  it('LINEA_SEPOLIA is linea-sepolia', () => {
    expect(LINEA_SEPOLIA).toBe('linea-sepolia');
  });

  it('GOERLI is goerli', () => {
    expect(GOERLI).toBe('goerli');
  });

  it('RPC is rpc', () => {
    expect(RPC).toBe('rpc');
  });

  it('NO_RPC_BLOCK_EXPLORER is defined', () => {
    expect(NO_RPC_BLOCK_EXPLORER).toBe('NO_BLOCK_EXPLORER');
  });

  it('PRIVATENETWORK is defined', () => {
    expect(PRIVATENETWORK).toBe('PRIVATENETWORK');
  });

  it('IPFS_DEFAULT_GATEWAY_URL is defined', () => {
    expect(IPFS_DEFAULT_GATEWAY_URL).toContain('dweb.link');
  });

  describe('NETWORKS_CHAIN_ID', () => {
    it('MAINNET chain id is 0x1', () => {
      expect(NETWORKS_CHAIN_ID.MAINNET).toBe('0x1');
    });

    it('SEPOLIA chain id is correct', () => {
      expect(NETWORKS_CHAIN_ID.SEPOLIA).toBe('0xaa36a7');
    });

    it('BSC chain id is correct', () => {
      expect(NETWORKS_CHAIN_ID.BSC).toBe('0x38');
    });

    it('POLYGON chain id is correct', () => {
      expect(NETWORKS_CHAIN_ID.POLYGON).toBe('0x89');
    });

    it('LINEA_MAINNET chain id is correct', () => {
      expect(NETWORKS_CHAIN_ID.LINEA_MAINNET).toBe('0xe708');
    });
  });

  describe('DEPRECATED_NETWORKS', () => {
    it('contains GOERLI', () => {
      expect(DEPRECATED_NETWORKS).toContain(NETWORKS_CHAIN_ID.GOERLI);
    });

    it('does not contain MAINNET', () => {
      expect(DEPRECATED_NETWORKS).not.toContain(NETWORKS_CHAIN_ID.MAINNET);
    });
  });

  describe('CHAINLIST_CURRENCY_SYMBOLS_MAP', () => {
    it('MAINNET is ETH', () => {
      expect(CHAINLIST_CURRENCY_SYMBOLS_MAP.MAINNET).toBe('ETH');
    });

    it('SEPOLIA is SepoliaETH', () => {
      expect(CHAINLIST_CURRENCY_SYMBOLS_MAP.SEPOLIA).toBe('SepoliaETH');
    });
  });

  describe('CURRENCY_SYMBOL_BY_CHAIN_ID', () => {
    it('maps mainnet chain id to ETH', () => {
      expect(CURRENCY_SYMBOL_BY_CHAIN_ID[NETWORKS_CHAIN_ID.MAINNET]).toBe('ETH');
    });
  });

  describe('TEST_NETWORK_IDS', () => {
    it('contains SEPOLIA', () => {
      expect(TEST_NETWORK_IDS).toContain(NETWORKS_CHAIN_ID.SEPOLIA);
    });

    it('does not contain MAINNET', () => {
      expect(TEST_NETWORK_IDS).not.toContain(NETWORKS_CHAIN_ID.MAINNET);
    });
  });
});
