import { SNAPS_DERIVATION_PATHS } from './snaps';

describe('snaps constants', () => {
  describe('SNAPS_DERIVATION_PATHS', () => {
    it('is an array', () => {
      expect(Array.isArray(SNAPS_DERIVATION_PATHS)).toBe(true);
    });

    it('has multiple derivation paths', () => {
      expect(SNAPS_DERIVATION_PATHS.length).toBeGreaterThan(10);
    });

    it('each path has required fields', () => {
      SNAPS_DERIVATION_PATHS.forEach((dp) => {
        expect(dp.path).toBeDefined();
        expect(Array.isArray(dp.path)).toBe(true);
        expect(dp.path[0]).toBe('m');
        expect(dp.curve).toBeDefined();
        expect(['ed25519', 'secp256k1']).toContain(dp.curve);
        expect(dp.name).toBeDefined();
        expect(typeof dp.name).toBe('string');
      });
    });

    it('contains Bitcoin Native SegWit', () => {
      const btc = SNAPS_DERIVATION_PATHS.find((dp) => dp.name === 'Bitcoin Native SegWit');
      expect(btc).toBeDefined();
      expect(btc?.curve).toBe('secp256k1');
    });

    it('contains Solana', () => {
      const sol = SNAPS_DERIVATION_PATHS.find((dp) => dp.name === 'Solana');
      expect(sol).toBeDefined();
      expect(sol?.curve).toBe('ed25519');
    });

    it('contains Ethereum', () => {
      const eth = SNAPS_DERIVATION_PATHS.find((dp) => dp.name === 'Ethereum');
      expect(eth).toBeDefined();
      expect(eth?.curve).toBe('secp256k1');
    });
  });
});
