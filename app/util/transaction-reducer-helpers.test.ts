import BN from 'bnjs4';
import { getTxData, getTxMeta } from './transaction-reducer-helpers';

describe('transaction-reducer-helpers', () => {
  describe('getTxData', () => {
    it('returns empty object when called with no arguments', () => {
      expect(getTxData()).toEqual({});
    });

    it('returns empty object when called with empty object', () => {
      expect(getTxData({})).toEqual({});
    });

    it('extracts standard transaction properties', () => {
      const txMeta = {
        data: '0x123',
        from: '0xabc',
        to: '0xdef',
        value: new BN('1000'),
        gas: new BN('21000'),
        gasPrice: new BN('20000000000'),
      };
      const result = getTxData(txMeta);
      expect(result).toEqual({
        data: '0x123',
        from: '0xabc',
        to: '0xdef',
        value: txMeta.value,
        gas: txMeta.gas,
        gasPrice: txMeta.gasPrice,
      });
    });

    it('extracts EIP-1559 properties', () => {
      const txMeta = {
        from: '0xabc',
        to: '0xdef',
        maxFeePerGas: new BN('30000000000'),
        maxPriorityFeePerGas: new BN('2000000000'),
      };
      const result = getTxData(txMeta);
      expect(result).toEqual({
        from: '0xabc',
        to: '0xdef',
        maxFeePerGas: txMeta.maxFeePerGas,
        maxPriorityFeePerGas: txMeta.maxPriorityFeePerGas,
      });
    });

    it('excludes undefined properties', () => {
      const txMeta = {
        from: '0xabc',
        to: undefined,
        data: '0x123',
      };
      const result = getTxData(txMeta);
      expect(result).toEqual({
        from: '0xabc',
        data: '0x123',
      });
      expect(result).not.toHaveProperty('to');
    });

    it('includes securityAlertResponse when present', () => {
      const securityAlertResponse = {
        result_type: 'Benign',
        reason: 'test',
      };
      const txMeta = {
        from: '0xabc',
        securityAlertResponse,
      };
      const result = getTxData(txMeta);
      expect(result.securityAlertResponse).toEqual(securityAlertResponse);
    });
  });

  describe('getTxMeta', () => {
    it('returns empty object when called with no arguments', () => {
      expect(getTxMeta()).toEqual({});
    });

    it('returns empty object when called with empty object', () => {
      expect(getTxMeta({})).toEqual({});
    });

    it('excludes standard transaction properties', () => {
      const txMeta = {
        data: '0x123',
        from: '0xabc',
        to: '0xdef',
        value: new BN('1000'),
        gas: new BN('21000'),
        gasPrice: new BN('20000000000'),
        maxFeePerGas: new BN('30000000000'),
        maxPriorityFeePerGas: new BN('2000000000'),
      };
      const result = getTxMeta(txMeta);
      expect(result).toEqual({});
    });

    it('returns non-standard properties', () => {
      const txMeta = {
        from: '0xabc',
        securityAlertResponse: {
          result_type: 'Benign',
          reason: 'test',
        },
      };
      const result = getTxMeta(txMeta);
      expect(result).toEqual({
        securityAlertResponse: {
          result_type: 'Benign',
          reason: 'test',
        },
      });
    });
  });
});
