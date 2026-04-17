import { getTxData, getTxMeta } from './transaction-reducer-helpers';

describe('transaction-reducer-helpers', () => {
  describe('getTxData', () => {
    it('returns empty object for empty input', () => {
      expect(getTxData()).toEqual({});
    });

    it('extracts defined tx properties', () => {
      const txMeta = {
        data: '0x1234',
        from: '0xabc',
        to: '0xdef',
        value: '0x1' as any,
      };
      const result = getTxData(txMeta);
      expect(result).toEqual({
        data: '0x1234',
        from: '0xabc',
        to: '0xdef',
        value: '0x1',
      });
    });

    it('excludes undefined properties', () => {
      const txMeta = { from: '0xabc' };
      const result = getTxData(txMeta);
      expect(result).toEqual({ from: '0xabc' });
      expect(result).not.toHaveProperty('data');
      expect(result).not.toHaveProperty('to');
    });

    it('includes securityAlertResponse when defined', () => {
      const txMeta = {
        from: '0xabc',
        securityAlertResponse: { result_type: 'Benign', reason: '' } as any,
      };
      const result = getTxData(txMeta);
      expect(result.securityAlertResponse).toBeDefined();
    });
  });

  describe('getTxMeta', () => {
    it('returns empty object for empty input', () => {
      expect(getTxMeta()).toEqual({});
    });

    it('excludes standard tx properties', () => {
      const txMeta = {
        data: '0x1234',
        from: '0xabc',
        to: '0xdef',
        customField: 'test',
      } as any;
      const result = getTxMeta(txMeta);
      expect(result).not.toHaveProperty('data');
      expect(result).not.toHaveProperty('from');
      expect(result).not.toHaveProperty('to');
      expect(result).toEqual({ customField: 'test' });
    });
  });
});
