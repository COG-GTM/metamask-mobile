import { ENSCache, getCachedENSName, isDefaultAccountName } from './ENSUtils';

describe('ENSUtils', () => {
  describe('ENSCache', () => {
    beforeEach(() => {
      ENSCache.cache = {};
    });

    it('has an empty cache initially', () => {
      expect(ENSCache.cache).toEqual({});
    });

    it('can store values in cache', () => {
      ENSCache.cache['1:0x123'] = { name: 'test.eth', timestamp: Date.now() };
      expect(ENSCache.cache['1:0x123'].name).toBe('test.eth');
    });
  });

  describe('getCachedENSName', () => {
    beforeEach(() => {
      ENSCache.cache = {};
    });

    it('returns undefined for unsupported chain', () => {
      const result = getCachedENSName('0x123', '0x89');
      expect(result).toBeUndefined();
    });

    it('returns undefined for empty cache', () => {
      const result = getCachedENSName('0x123', '0x1');
      expect(result).toBeUndefined();
    });

    it('returns cached name when available', () => {
      ENSCache.cache['10x123'] = { name: 'test.eth', timestamp: Date.now() };
      const result = getCachedENSName('0x123', '0x1');
      expect(result).toBe('test.eth');
    });
  });

  describe('isDefaultAccountName', () => {
    it('returns true for "Account 1"', () => {
      expect(isDefaultAccountName('Account 1')).toBe(true);
    });

    it('returns true for "Account 99"', () => {
      expect(isDefaultAccountName('Account 99')).toBe(true);
    });

    it('returns false for custom name', () => {
      expect(isDefaultAccountName('My Wallet')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isDefaultAccountName('')).toBe(false);
    });
  });
});
