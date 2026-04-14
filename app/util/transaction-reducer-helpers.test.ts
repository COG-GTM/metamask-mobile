import { getTxData, getTxMeta } from './transaction-reducer-helpers';

describe('transaction-reducer-helpers', () => {
  describe('getTxData', () => {
    it('should return empty object for empty input', () => {
      expect(getTxData()).toStrictEqual({});
    });

    it('should return only defined properties', () => {
      const result = getTxData({ from: '0x123', to: '0x456' });
      expect(result).toStrictEqual({ from: '0x123', to: '0x456' });
    });

    it('should exclude undefined properties', () => {
      const result = getTxData({ from: '0x123' });
      expect(result).not.toHaveProperty('to');
      expect(result).not.toHaveProperty('gas');
    });
  });

  describe('getTxMeta', () => {
    it('should return empty object for empty input', () => {
      expect(getTxMeta()).toStrictEqual({});
    });

    it('should exclude standard tx data properties', () => {
      const result = getTxMeta({ from: '0x123', to: '0x456' } as any);
      expect(result).not.toHaveProperty('from');
      expect(result).not.toHaveProperty('to');
    });
  });
});
