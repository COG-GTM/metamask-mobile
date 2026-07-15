import { getTxData, getTxMeta } from './transaction-reducer-helpers';

describe('transaction-reducer-helpers', () => {
  describe('getTxData', () => {
    it('returns an empty object when called with no arguments', () => {
      expect(getTxData()).toStrictEqual({});
    });

    it('returns only the standard transaction properties', () => {
      const txMeta = {
        data: '0x1',
        from: '0xfrom',
        to: '0xto',
        extra: 'ignored',
        id: 'ignored-too',
      } as unknown as Parameters<typeof getTxData>[0];

      expect(getTxData(txMeta)).toStrictEqual({
        data: '0x1',
        from: '0xfrom',
        to: '0xto',
      });
    });

    it('omits properties whose value is undefined', () => {
      const txMeta = {
        data: '0x1',
        from: undefined,
        to: '0xto',
      } as unknown as Parameters<typeof getTxData>[0];

      const result = getTxData(txMeta);
      expect(result).toStrictEqual({ data: '0x1', to: '0xto' });
      expect('from' in result).toBe(false);
    });
  });

  describe('getTxMeta', () => {
    it('returns an empty object when called with no arguments', () => {
      expect(getTxMeta()).toStrictEqual({});
    });

    it('returns only the non-standard (meta) properties', () => {
      const txMeta = {
        data: '0x1',
        from: '0xfrom',
        to: '0xto',
        id: 'tx-1',
        status: 'submitted',
      } as unknown as Parameters<typeof getTxMeta>[0];

      expect(getTxMeta(txMeta)).toStrictEqual({
        id: 'tx-1',
        status: 'submitted',
      });
    });

    it('omits meta properties whose value is undefined', () => {
      const txMeta = {
        data: '0x1',
        id: 'tx-1',
        status: undefined,
      } as unknown as Parameters<typeof getTxMeta>[0];

      const result = getTxMeta(txMeta);
      expect(result).toStrictEqual({ id: 'tx-1' });
      expect('status' in result).toBe(false);
    });
  });
});
