import { tokenListToArray, compareTokenIds } from './index';

describe('tokens utils', () => {
  describe('tokenListToArray', () => {
    it('converts token map to array', () => {
      const tokenMap = {
        '0x123': { address: '0x123', symbol: 'TKN', decimals: 18, name: 'Token', aggregators: [], occurrences: 1, iconUrl: '' },
        '0x456': { address: '0x456', symbol: 'TK2', decimals: 18, name: 'Token2', aggregators: [], occurrences: 1, iconUrl: '' },
      };
      const result = tokenListToArray(tokenMap);
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(2);
    });

    it('returns empty array for empty map', () => {
      const result = tokenListToArray({});
      expect(result).toEqual([]);
    });
  });

  describe('compareTokenIds', () => {
    it('compares string to string', () => {
      expect(compareTokenIds('123', '123')).toBe(true);
    });

    it('returns false for different strings', () => {
      expect(compareTokenIds('123', '456')).toBe(false);
    });

    it('compares number to string', () => {
      expect(compareTokenIds(123, '123')).toBe(true);
    });

    it('returns false for different number and string', () => {
      expect(compareTokenIds(123, '456')).toBe(false);
    });
  });
});
