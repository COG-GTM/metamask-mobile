import BN from 'bnjs4';
import { getTxData, getTxMeta } from './transaction-reducer-helpers';

describe('transaction-reducer-helpers', () => {
  const gas = new BN(21000);
  const value = new BN(1);

  describe('getTxData', () => {
    it('returns only defined standard properties', () => {
      expect(
        getTxData({
          from: '0x1',
          to: '0x2',
          gas,
          value,
          data: undefined,
        }),
      ).toEqual({ from: '0x1', to: '0x2', gas, value });
    });

    it('excludes non standard properties', () => {
      const txMeta = {
        from: '0x1',
        extra: 'value',
      } as unknown as Parameters<typeof getTxData>[0];
      expect(getTxData(txMeta)).toEqual({ from: '0x1' });
    });

    it('returns an empty object by default', () => {
      expect(getTxData()).toEqual({});
    });
  });

  describe('getTxMeta', () => {
    it('returns only the non standard properties', () => {
      const txMeta = {
        from: '0x1',
        to: '0x2',
        gas,
        value,
        securityAlertResponse: { reason: 'r' },
        origin: 'metamask',
        undefinedProp: undefined,
      } as unknown as Parameters<typeof getTxMeta>[0];
      expect(getTxMeta(txMeta)).toEqual({
        securityAlertResponse: { reason: 'r' },
        origin: 'metamask',
      });
    });

    it('returns an empty object by default', () => {
      expect(getTxMeta()).toEqual({});
    });
  });
});
