import { isAssetFromSearch } from './tokenSearchDiscoveryDataController';

describe('tokenSearchDiscoveryDataController selectors', () => {
  describe('isAssetFromSearch', () => {
    it('returns true for asset with isFromSearch=true', () => {
      expect(isAssetFromSearch({ isFromSearch: true, address: '0x1' })).toBe(true);
    });

    it('returns false for asset with isFromSearch=false', () => {
      expect(isAssetFromSearch({ isFromSearch: false, address: '0x1' })).toBe(false);
    });

    it('returns false for asset without isFromSearch', () => {
      expect(isAssetFromSearch({ address: '0x1' })).toBe(false);
    });

    it('returns false for null', () => {
      expect(isAssetFromSearch(null)).toBe(false);
    });

    it('returns false for undefined', () => {
      expect(isAssetFromSearch(undefined)).toBe(false);
    });

    it('returns false for string', () => {
      expect(isAssetFromSearch('test')).toBe(false);
    });

    it('returns false for number', () => {
      expect(isAssetFromSearch(42)).toBe(false);
    });
  });
});
