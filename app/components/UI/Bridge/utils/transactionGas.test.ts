import { TransactionMeta } from '@metamask/transaction-controller';
import { calcHexGasTotal } from './transactionGas';

describe('calcHexGasTotal', () => {
  it('computes a non-zero hex total when txParams.gas and gasPrice are provided (non-EIP1559 path)', () => {
    const txMeta = {
      txParams: {
        gas: '0x5208', // 21000
        gasPrice: '0x3b9aca00', // 1 gwei
      },
    } as unknown as TransactionMeta;

    const total = calcHexGasTotal(txMeta);
    expect(total.startsWith('0x')).toBe(true);
    expect(total).not.toBe('0x0');
  });

  it('prefers receipt gasUsed and effectiveGasPrice when available (EIP1559 path)', () => {
    const txMeta = {
      txParams: { gas: '0xffff', gasPrice: undefined },
      txReceipt: {
        gasUsed: '0x5208', // 21000
        effectiveGasPrice: '0x3b9aca00', // 1 gwei
      },
    } as unknown as TransactionMeta;

    // Using receipt gas (0x5208) instead of txParams.gas (0xffff=65535) yields a smaller total.
    const usingReceipt = calcHexGasTotal(txMeta);
    const usingParams = calcHexGasTotal({
      txParams: { gas: '0xffff', gasPrice: '0x3b9aca00' },
    } as unknown as TransactionMeta);
    expect(BigInt(usingReceipt)).toBeLessThan(BigInt(usingParams));
  });

  it('falls back to gasPrice from params when receipt lacks effectiveGasPrice', () => {
    const txMeta = {
      txParams: { gas: '0x5208', gasPrice: '0x1' },
      txReceipt: {},
    } as unknown as TransactionMeta;

    const total = calcHexGasTotal(txMeta);
    expect(total.startsWith('0x')).toBe(true);
    expect(total).not.toBe('0x0');
  });

  it('returns 0x0 when neither gas nor price data is present', () => {
    const txMeta = {
      txParams: {},
      txReceipt: {},
    } as unknown as TransactionMeta;

    expect(calcHexGasTotal(txMeta)).toBe('0x0');
  });

  it('returns 0x0 when txParams and txReceipt are missing entirely', () => {
    const txMeta = {} as unknown as TransactionMeta;
    expect(calcHexGasTotal(txMeta)).toBe('0x0');
  });
});
