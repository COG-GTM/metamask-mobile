import { convertNetworkId } from './engineNetworkUtils';

describe('engineNetworkUtils', () => {
  describe('convertNetworkId', () => {
    it('converts number to string', () => {
      expect(convertNetworkId(1)).toBe('1');
    });

    it('converts hex string to decimal string', () => {
      expect(convertNetworkId('0x1')).toBe('1');
    });

    it('converts hex string 0xa to 10', () => {
      expect(convertNetworkId('0xa')).toBe('10');
    });

    it('returns decimal string as-is', () => {
      expect(convertNetworkId('42')).toBe('42');
    });

    it('throws for NaN', () => {
      expect(() => convertNetworkId(NaN)).toThrow('Cannot parse');
    });

    it('throws for invalid string', () => {
      expect(() => convertNetworkId('abc')).toThrow('Cannot parse');
    });
  });
});
