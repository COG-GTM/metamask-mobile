import { SNAPS_DERIVATION_PATHS } from './snaps';

describe('snaps constants', () => {
  describe('SNAPS_DERIVATION_PATHS', () => {
    it('is a non-empty array', () => {
      expect(Array.isArray(SNAPS_DERIVATION_PATHS)).toBe(true);
      expect(SNAPS_DERIVATION_PATHS.length).toBeGreaterThan(0);
    });

    it('each entry has path, curve, and name', () => {
      SNAPS_DERIVATION_PATHS.forEach((entry) => {
        expect(Array.isArray(entry.path)).toBe(true);
        expect(entry.path[0]).toBe('m');
        expect(entry.path.length).toBeGreaterThan(1);
        expect(typeof entry.curve).toBe('string');
        expect(['ed25519', 'secp256k1']).toContain(entry.curve);
        expect(typeof entry.name).toBe('string');
        expect(entry.name.length).toBeGreaterThan(0);
      });
    });

    it('contains Bitcoin Legacy path', () => {
      const btcLegacy = SNAPS_DERIVATION_PATHS.find(
        (p) => p.name === 'Bitcoin Legacy',
      );
      expect(btcLegacy).toBeDefined();
      expect(btcLegacy?.curve).toBe('secp256k1');
    });

    it('contains Ethereum path', () => {
      const eth = SNAPS_DERIVATION_PATHS.find(
        (p) => p.name === 'Ethereum',
      );
      expect(eth).toBeDefined();
      expect(eth?.curve).toBe('secp256k1');
    });

    it('contains Solana paths', () => {
      const solPaths = SNAPS_DERIVATION_PATHS.filter(
        (p) => p.name === 'Solana',
      );
      expect(solPaths.length).toBeGreaterThanOrEqual(1);
      solPaths.forEach((p) => {
        expect(p.curve).toBe('ed25519');
      });
    });
  });
});
