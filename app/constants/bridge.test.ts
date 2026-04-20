import {
  ALLOWED_BRIDGE_CHAIN_IDS,
  ETH_USDT_ADDRESS,
  NETWORK_TO_SHORT_NETWORK_NAME_MAP,
} from './bridge';

describe('bridge constants', () => {
  describe('ALLOWED_BRIDGE_CHAIN_IDS', () => {
    it('is a non-empty array', () => {
      expect(Array.isArray(ALLOWED_BRIDGE_CHAIN_IDS)).toBe(true);
      expect(ALLOWED_BRIDGE_CHAIN_IDS.length).toBeGreaterThan(0);
    });

    it('contains known chain IDs', () => {
      // Should include major chains
      expect(ALLOWED_BRIDGE_CHAIN_IDS.length).toBeGreaterThanOrEqual(9);
    });
  });

  describe('ETH_USDT_ADDRESS', () => {
    it('is a valid Ethereum address', () => {
      expect(ETH_USDT_ADDRESS).toMatch(/^0x[0-9a-fA-F]{40}$/);
    });
  });

  describe('NETWORK_TO_SHORT_NETWORK_NAME_MAP', () => {
    it('maps chain IDs to network names', () => {
      const values = Object.values(NETWORK_TO_SHORT_NETWORK_NAME_MAP);
      expect(values.length).toBeGreaterThan(0);
      values.forEach((name) => {
        expect(typeof name).toBe('string');
        expect(name.length).toBeGreaterThan(0);
      });
    });

    it('includes Ethereum', () => {
      expect(Object.values(NETWORK_TO_SHORT_NETWORK_NAME_MAP)).toContain(
        'Ethereum',
      );
    });
  });
});
