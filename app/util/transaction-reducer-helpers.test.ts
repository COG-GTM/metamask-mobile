import { getTxData, getTxMeta } from './transaction-reducer-helpers';

describe('transaction-reducer-helpers', () => {
  const txMeta = {
    data: '0xabc',
    from: '0xfrom',
    to: '0xto',
    value: undefined,
    gas: undefined,
    symbol: 'ETH',
    readableValue: '1',
    id: undefined,
  };

  describe('getTxData', () => {
    it('returns only the defined standard transaction properties', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(getTxData(txMeta as any)).toEqual({
        data: '0xabc',
        from: '0xfrom',
        to: '0xto',
      });
    });

    it('returns an empty object when called without arguments', () => {
      expect(getTxData()).toEqual({});
    });

    it('includes securityAlertResponse when defined', () => {
      const securityAlertResponse = { result_type: 'Benign' };
      expect(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getTxData({ securityAlertResponse } as any).securityAlertResponse,
      ).toBe(securityAlertResponse);
    });
  });

  describe('getTxMeta', () => {
    it('returns only the defined non-standard properties', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(getTxMeta(txMeta as any)).toEqual({
        symbol: 'ETH',
        readableValue: '1',
      });
    });

    it('returns an empty object when called without arguments', () => {
      expect(getTxMeta()).toEqual({});
    });
  });
});
