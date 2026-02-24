import { getTxData, getTxMeta } from './transaction-reducer-helpers';

describe('transaction-reducer-helpers', () => {
  describe('getTxData', () => {
    it('returns empty object when called with no args', () => {
      const result = getTxData();
      expect(result).toEqual({});
    });

    it('returns empty object when called with empty object', () => {
      const result = getTxData({});
      expect(result).toEqual({});
    });

    it('extracts defined tx data properties', () => {
      const txMeta = {
        data: '0x123',
        from: '0xfrom',
        gas: 21000,
        gasPrice: 1000000000,
        to: '0xto',
        value: 100,
      };
      const result = getTxData(txMeta as any);
      expect(result).toEqual({
        data: '0x123',
        from: '0xfrom',
        gas: 21000,
        gasPrice: 1000000000,
        to: '0xto',
        value: 100,
      });
    });

    it('extracts EIP-1559 properties', () => {
      const txMeta = {
        from: '0xfrom',
        to: '0xto',
        maxFeePerGas: 2000000000,
        maxPriorityFeePerGas: 1000000000,
      };
      const result = getTxData(txMeta as any);
      expect(result).toEqual({
        from: '0xfrom',
        to: '0xto',
        maxFeePerGas: 2000000000,
        maxPriorityFeePerGas: 1000000000,
      });
    });

    it('filters out undefined properties', () => {
      const txMeta = {
        from: '0xfrom',
        to: undefined,
        gas: undefined,
      };
      const result = getTxData(txMeta as any);
      expect(result).toEqual({ from: '0xfrom' });
      expect(result).not.toHaveProperty('to');
      expect(result).not.toHaveProperty('gas');
    });

    it('includes securityAlertResponse when defined', () => {
      const txMeta = {
        from: '0xfrom',
        securityAlertResponse: { result_type: 'Benign' },
      };
      const result = getTxData(txMeta as any);
      expect(result).toEqual({
        from: '0xfrom',
        securityAlertResponse: { result_type: 'Benign' },
      });
    });
  });

  describe('getTxMeta', () => {
    it('returns empty object when called with no args', () => {
      const result = getTxMeta();
      expect(result).toEqual({});
    });

    it('returns empty object when called with empty object', () => {
      const result = getTxMeta({});
      expect(result).toEqual({});
    });

    it('excludes tx data properties and returns rest', () => {
      const txMeta = {
        from: '0xfrom',
        to: '0xto',
        gas: 21000,
        symbol: 'ETH',
        readableValue: '1.0',
      };
      const result = getTxMeta(txMeta as any);
      expect(result).toEqual({
        symbol: 'ETH',
        readableValue: '1.0',
      });
      expect(result).not.toHaveProperty('from');
      expect(result).not.toHaveProperty('to');
      expect(result).not.toHaveProperty('gas');
    });

    it('excludes EIP-1559 properties', () => {
      const txMeta = {
        maxFeePerGas: 2000000000,
        maxPriorityFeePerGas: 1000000000,
        symbol: 'ETH',
      };
      const result = getTxMeta(txMeta as any);
      expect(result).toEqual({ symbol: 'ETH' });
      expect(result).not.toHaveProperty('maxFeePerGas');
      expect(result).not.toHaveProperty('maxPriorityFeePerGas');
    });

    it('filters out undefined meta properties', () => {
      const txMeta = {
        from: '0xfrom',
        symbol: undefined,
        readableValue: '1.0',
      };
      const result = getTxMeta(txMeta as any);
      expect(result).toEqual({ readableValue: '1.0' });
      expect(result).not.toHaveProperty('symbol');
    });
  });
});
