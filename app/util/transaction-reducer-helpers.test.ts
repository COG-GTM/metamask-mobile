import { getTxData, getTxMeta } from './transaction-reducer-helpers';

describe('transaction-reducer-helpers', () => {
  describe('getTxData', () => {
    it('returns only defined standard transaction fields', () => {
      const txMeta = {
        data: '0xdata',
        from: '0xfrom',
        to: '0xto',
        gas: undefined,
        gasPrice: undefined,
        value: undefined,
        maxFeePerGas: undefined,
        maxPriorityFeePerGas: undefined,
        securityAlertResponse: undefined,
      } as unknown as Parameters<typeof getTxData>[0];

      expect(getTxData(txMeta)).toEqual({
        data: '0xdata',
        from: '0xfrom',
        to: '0xto',
      });
    });

    it('returns an empty object when called with no arguments', () => {
      expect(getTxData()).toEqual({});
    });
  });

  describe('getTxMeta', () => {
    it('returns only non-standard defined fields, excluding the standard tx ones', () => {
      const txMeta = {
        data: '0xdata',
        from: '0xfrom',
        extraProp: 'hello',
        maybeDefined: undefined,
      } as unknown as Parameters<typeof getTxMeta>[0];

      const result = getTxMeta(txMeta);
      expect(result).toEqual({ extraProp: 'hello' });
      expect(result).not.toHaveProperty('data');
      expect(result).not.toHaveProperty('from');
    });

    it('returns an empty object when called with no arguments', () => {
      expect(getTxMeta()).toEqual({});
    });
  });
});
